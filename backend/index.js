const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // For parsing cookies
require("./db/config");
const bcrypt = require("bcryptjs");
const user = require("./db/user");
const business = require("./db/business");
const job = require("./db/job");
const Application = require("./db/application");
const Interview = require("./db/interview");
const Notification = require("./db/notification");
const Log = require("./db/log");
const app = express();
require("dotenv").config();
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const nodemailer = require("nodemailer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_API_PORT = Number(process.env.NODE_API_PORT || 5000);
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${process.env.NODE_API_URL || `http://localhost:${NODE_API_PORT}`}/auth/google/callback`;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ai.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Verify environment variables are loaded
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_SECRET_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser()); // Use cookie-parser
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-fallback-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;
      await Log.create({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime,
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (err) {
      console.error("Failed to log request:", err);
    }
  });
  next();
});

// Authorization helpers
const requireAdmin = (req, res, next) => {
  if (!req.session || (!req.session.user && !req.session.business && !req.session.admin)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.session && req.session.admin) return next();
  return res.status(403).json({ message: 'Admin privileges required' });
};

const requireBusinessOwnerOrAdminForApplication = async (req, res, next) => {
  try {
    if (!req.session || (!req.session.business && !req.session.admin)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const appDoc = await Application.findById(req.params.id);
    if (!appDoc) return res.status(404).json({ message: 'Application not found' });
    const sessionBusinessEmail = req.session && req.session.business && req.session.business.email;
    if (req.session && req.session.admin) return next();
    if (sessionBusinessEmail && sessionBusinessEmail === appDoc.business_email) return next();
    return res.status(403).json({ message: 'Not authorized for this application' });
  } catch (err) {
    console.error('Authorization error:', err);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

const requireBusinessOrAdminForJob = async (req, res, next) => {
  try {
    if (!req.session || (!req.session.business && !req.session.admin)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const jobDoc = await job.findById(req.params.id);
    if (!jobDoc) return res.status(404).json({ message: 'Job not found' });
    const sessionBusinessEmail = req.session && req.session.business && req.session.business.email;
    if (req.session && req.session.admin) return next();
    if (sessionBusinessEmail && sessionBusinessEmail === jobDoc.email) return next();
    return res.status(403).json({ message: 'Not authorized for this job' });
  } catch (err) {
    console.error('Authorization error:', err);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value; // Primary email
        const name = profile.displayName; // Full name

        let existingUser = await user.findOne({ email });
        if (!existingUser) {
          const newUser = new user({ name, email, password: null });
          existingUser = await newUser.save();
          console.log("New user created:", existingUser);
        } else {
          console.log("User already exists:", existingUser);
        }

        done(null, existingUser);
      } catch (error) {
        console.error("Error during Google OAuth:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


// --- CONFIGURATION --- //

// 1. Setup Nodemailer Transporter
const transporter =
  EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      })
    : null;

// --- ROUTES --- //

// Route 1: Send OTP
app.post("/forgot-password/send-otp", async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    let existingUser = await user.findOne({ email });
    if (!existingUser) {
      existingUser = await business.findOne({ email });
    }
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!transporter) {
      return res.status(500).json({ message: "Email service is not configured" });
    }

    // 2. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 3. Save OTP and Expiration (10 minutes from now) to the database
    existingUser.resetPasswordOtp = otp;
    existingUser.resetPasswordOtpExpires = Date.now() + 3600000; // 1 hour
    await existingUser.save();

    // 4. Send Email
    const mailOptions = {
      from: EMAIL_USER,
      to: existingUser.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        return res.status(200).json({ message: "OTP sent successfully" });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route 2: Verify OTP
app.post("/forgot-password/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    let existingUser = await user.findOne({ email });

    if (!existingUser) {
      existingUser = await business.findOne({ email });
    }
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and hasn't expired
    if (existingUser.resetPasswordOtp !== parseInt(otp) || existingUser.resetPasswordOtpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route 3: Reset Password
app.post("/forgot-password/reset", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    let existingUser = await user.findOne({ email });

    if (!existingUser) {
      existingUser = await business.findOne({ email });
    }

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 2. Update user record
    existingUser.password = hashedPassword;
    
    // 3. Clear the OTP fields so they can't be reused
    existingUser.resetPasswordOtp = undefined;
    existingUser.resetPasswordOtpExpires = undefined;
    
    await existingUser.save();

    res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});




// Google OAuth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    try {
      const user = req.user;
      console.log("Google user data:", user); // Debug: Log user data

      // Extract username and email
      const username = user.name;
      const userEmail = user.email;

      // Set cookies
      res
        .cookie("username", username || "", { httpOnly: true, secure: false })
        .cookie("email", userEmail || "", { httpOnly: true, secure: false })
        .redirect(`${FRONTEND_URL}/candidate/home`);
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.status(500).redirect(FRONTEND_URL);
    }
  }
);

// Candidate Login
app.post("/logincand", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existingUser = await user.findOne({ email });
    if (!existingUser) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Set session for candidate
    req.session.user = {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.name,
      role: 'candidate',
    };

    // Set cookies
    res.cookie('username', existingUser.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('email', existingUser.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: 'Login successful', user: { name: existingUser.name, email: existingUser.email }, redirectTo: '/candidate/home' });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "An error occurred during login" });
  }
});

// Business Login
app.post("/loginbuss", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingBusiness = await business.findOne({ email });

    if (!existingBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    const isMatch = await bcrypt.compare(password, existingBusiness.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set session
    req.session.business = {
      id: existingBusiness._id,
      email: existingBusiness.email,
      name: existingBusiness.name,
    };

    // Set cookies
    res.cookie("businessName", existingBusiness.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("businessEmail", existingBusiness.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      business: {
        name: existingBusiness.name,
        email: existingBusiness.email,
      },
      redirectTo: "/business/home", // Add redirect URL in response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "An error occurred during login" });
  }
});

// Registration Routes
app.post("/registercand", async (req, res) => {
  const { name, email, password, contact } = req.body;

  try {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const new_user = new user({ name, email, password: hashedPassword, contact });
    await new_user.save();

    res.status(201).json({ message: "User registered successfully", user: { name, email } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred, please try again later." });
  }
});

app.post("/registerbuss", async (req, res) => {
  const { name, email, password, contact, address } = req.body;

  try {
    const existingUser = await business.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const new_business = new business({ name, email, password: hashedPassword, contact, address });
    await new_business.save();

    res.status(201).json({ message: "User registered successfully", user: { name, email } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred, please try again later." });
  }
});

app.post("/setjob", async (req, res) => {
  const { name, email, basicDetails, mcqTest, technicalInterview, hrInterview } = req.body;

  try {
    const newJob = new job({
      name,
      email,
      basicDetails,
      mcqTest,
      technicalInterview,
      hrInterview,
    });

    await newJob.save();
    res.status(201).json({ message: "Job posted successfully" });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Failed to post job" });
  }
});

app.get("/getjobs", async (req, res) => {
  try {
    const { search, location, type, page, limit } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { "basicDetails.title": new RegExp(search, "i") },
        { "basicDetails.company": new RegExp(search, "i") },
        { "basicDetails.description": new RegExp(search, "i") },
      ];
    }
    if (location) filter["basicDetails.location"] = new RegExp(location, "i");
    if (type) filter["basicDetails.jobType"] = new RegExp(type, "i");

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const jobs = await job.find(filter).skip(skip).limit(limitNum);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const jobDoc = await job.findById(req.params.id);
    if (!jobDoc) return res.status(404).json({ message: "Job not found" });
    res.json(jobDoc);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

// Get jobs for a specific business
app.get("/jobs/business/:email", async (req, res) => {
  try {
    const jobs = await job.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch business jobs" });
  }
});

// Update a job
app.put("/jobs/:id", requireBusinessOrAdminForJob, async (req, res) => {
  try {
    const updatedJob = await job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: "Failed to update job" });
  }
});

// Delete a job
app.delete("/jobs/:id", requireBusinessOrAdminForJob, async (req, res) => {
  try {
    const deletedJob = await job.findByIdAndDelete(req.params.id);
    if (!deletedJob) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job" });
  }
});

// Business Dashboard Stats
app.get("/business/dashboard-stats", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });
    
    const jobsCount = await job.countDocuments({ email });
    const appsCount = await Application.countDocuments({ business_email: email });
    const hiredCount = await Application.countDocuments({ business_email: email, status: "approved" });
    const activeInterviews = await Application.countDocuments({ business_email: email, status: "interview_scheduled" });

    res.json({
      activeJobs: jobsCount,
      totalApplications: appsCount,
      hiredCandidates: hiredCount,
      activeInterviews: activeInterviews
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Contact Candidate
app.post("/contact-candidate", async (req, res) => {
  try {
    const { candidateEmail, subject, message, businessEmail } = req.body;
    
    await Notification.create({
      to: candidateEmail,
      type: "message_from_employer",
      title: subject,
      message: message,
      data: { from: businessEmail }
    });

    if (transporter) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: candidateEmail,
        replyTo: businessEmail,
        subject: subject,
        text: message
      });
    }

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});



// Candidate Profile Routes

// Get Candidate Profile
app.get("/api/candidate/profile", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await user.findOne({ email }, { password: 0, resetPasswordOtp: 0, resetPasswordOtpExpires: 0 });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: existingUser.name || "",
      email: existingUser.email || "",
      contact: existingUser.contact || "",
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update Candidate Profile
app.put("/api/candidate/profile", async (req, res) => {
  try {
    const { currentEmail, name, email, contact } = req.body;

    if (!currentEmail) {
      return res.status(400).json({ message: "Current email is required to identify user" });
    }

    const existingUser = await user.findOne({ email: currentEmail });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new email is already taken by another user
    if (email && email !== currentEmail) {
      const emailTaken = await user.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "Email is already in use by another account" });
      }
    }

    // Update fields
    if (name !== undefined) existingUser.name = name;
    if (email !== undefined) existingUser.email = email;
    if (contact !== undefined) existingUser.contact = contact;

    await existingUser.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        name: existingUser.name,
        email: existingUser.email,
        contact: existingUser.contact || "",
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get Business Profile
app.get("/api/business/profile", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const businessDoc = await business.findOne({ email }).select("-password");
    if (!businessDoc) return res.status(404).json({ message: "Business not found" });
    res.json(businessDoc);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch business profile" });
  }
});

// Update Business Profile
app.put("/api/business/profile", async (req, res) => {
  try {
    const { currentEmail, name, contact, address } = req.body;
    if (!currentEmail) return res.status(400).json({ message: "Current email is required" });
    
    const existingBusiness = await business.findOne({ email: currentEmail });
    if (!existingBusiness) return res.status(404).json({ message: "Business not found" });

    if (name !== undefined) existingBusiness.name = name;
    if (contact !== undefined) existingBusiness.contact = contact;
    if (address !== undefined) existingBusiness.address = address;

    await existingBusiness.save();
    res.json({ message: "Business profile updated successfully", business: existingBusiness });
  } catch (error) {
    res.status(500).json({ message: "Failed to update business profile" });
  }
});

// Change Password
app.post("/api/change-password", async (req, res) => {
  try {
    const { email, role, currentPassword, newPassword } = req.body;
    if (!email || !role || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let Model;
    if (role === "candidate") Model = user;
    else if (role === "business") Model = business;
    else return res.status(400).json({ message: "Invalid role" });

    const account = await Model.findOne({ email });
    if (!account) return res.status(404).json({ message: "Account not found" });

    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});
// Admin Routes

// Admin Login
app.post("/loginadmin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Mark session as admin
      if (req.session) {
        req.session.admin = true;
        req.session.user = { name: 'Admin', email: ADMIN_EMAIL, role: 'admin' };
      }
      res.json({
        success: true,
        message: "Admin Login successful",
        user: { name: "Admin", email: ADMIN_EMAIL },
        redirectTo: "/admin/home"
      });
    } else {
      res.status(401).json({ message: "Invalid admin credentials" });
    }
  } catch (error) {
    console.error("Admin Login error:", error);
    res.status(500).json({ success: false, message: "An error occurred during admin login" });
  }
});

// Get All Users (Admin)
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const candidates = await user.find({}, { password: 0 }); // Exclude password
    const businesses = await business.find({}, { password: 0 });

    // Add type field
    const candidatesWithType = candidates.map(u => ({ ...u.toObject(), type: "candidate" }));
    const businessesWithType = businesses.map(b => ({ ...b.toObject(), type: "business" }));

    res.json([...candidatesWithType, ...businessesWithType]);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Delete User (Admin)
app.delete("/api/admin/user/:type/:id", requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    let result;

    if (type === "candidate") {
      result = await user.findByIdAndDelete(id);
    } else if (type === "business") {
      result = await business.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Update User (Admin)
app.put("/api/admin/user/:type/:id", requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const updateData = req.body;
    let result;

    // Prevent password update from this endpoint for security (unless specifically requested/hashed)
    delete updateData.password;

    if (type === "candidate") {
      result = await user.findByIdAndUpdate(id, updateData, { new: true });
    } else if (type === "business") {
      result = await business.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: result });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete Job (Admin)
app.delete("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const deletedJob = await job.findByIdAndDelete(req.params.id);
    if (!deletedJob) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job" });
  }
});

// Get System Logs (Admin)
app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});



app.listen(NODE_API_PORT, () => {
  console.log(`Server is running on port ${NODE_API_PORT}`);
});

// --- Applications API --- //
// Candidate applies to a job
app.post("/apply", async (req, res) => {
  try {
    const { job_id, candidate_email, candidate_name, resume, ats_score, session_id } = req.body;
    if (!job_id || !candidate_email) {
      return res.status(400).json({ message: "job_id and candidate_email are required" });
    }

    const existingApp = await Application.findOne({ job_id, candidate_email });
    if (existingApp) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const jobDoc = await job.findById(job_id);
    if (!jobDoc) {
      return res.status(404).json({ message: "Job not found" });
    }

    const newApp = new Application({
      job_id,
      job_title: jobDoc.basicDetails?.title || jobDoc.name,
      business_email: jobDoc.email,
      candidate_email,
      candidate_name,
      resume,
      ats_score: ats_score || 0,
      session_id,
      status: "pending",
    });

    await newApp.save();
    // create in-app notification for the business
    try {
      await Notification.create({
        to: jobDoc.email,
        type: 'application_received',
        title: 'New application received',
        message: `${candidate_name || candidate_email} applied for ${newApp.job_title}`,
        data: { application_id: newApp._id.toString(), job_id },
      });
    } catch (nerr) {
      console.error('Failed to create notification:', nerr);
    }
    res.status(201).json({ message: "Application submitted", application: newApp });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
});

// List applications (candidate or employer view)
app.get("/applications", async (req, res) => {
  try {
    const { candidate_email, business_email, job_id, status } = req.query;
    const filter = {};
    if (candidate_email) filter.candidate_email = candidate_email;
    if (business_email) filter.business_email = business_email;
    if (job_id) filter.job_id = job_id;
    if (status) filter.status = status;

    const apps = await Application.find(filter).sort({ applied_at: -1 });
    res.json(apps);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// Get single application
app.get("/applications/:id", async (req, res) => {
  try {
    const appDoc = await Application.findById(req.params.id);
    if (!appDoc) return res.status(404).json({ message: "Application not found" });
    res.json(appDoc);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Failed to fetch application" });
  }
});

// Update application status (shortlist, schedule, approve, reject)
app.put("/applications/:id/status", requireBusinessOwnerOrAdminForApplication, async (req, res) => {
  try {
    const { status, note, changed_by } = req.body;
    const valid = ["pending", "ongoing", "shortlisted", "approved", "rejected"];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appDoc = await Application.findById(req.params.id);
    if (!appDoc) return res.status(404).json({ message: "Application not found" });

    appDoc.history = appDoc.history || [];
    appDoc.history.push({ status, note: note || "", changed_by: changed_by || "system", changed_at: new Date() });
    appDoc.status = status;
    appDoc.updated_at = new Date();

    await appDoc.save();

    // trigger in-app notification and email to candidate
    try {
      await Notification.create({
        to: appDoc.candidate_email,
        type: 'application_status',
        title: `Application ${appDoc.status}`,
        message: `Your application for ${appDoc.job_title} is now ${appDoc.status}`,
        data: { application_id: appDoc._id.toString(), status: appDoc.status },
      });
    } catch (nerr) {
      console.error('Failed to create notification:', nerr);
    }

    if (transporter) {
      try {
        await transporter.sendMail({
          from: EMAIL_USER,
          to: appDoc.candidate_email,
          subject: `Application status update: ${appDoc.job_title}`,
          text: `Hello ${appDoc.candidate_name || ''},\n\nYour application for ${appDoc.job_title} is now ${appDoc.status}.\n\nRegards,\nRecruitment Team`,
        });
      } catch (mailErr) {
        console.error('Failed to send status email:', mailErr);
      }
    }

    res.json({ message: "Application status updated", application: appDoc });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});


});

// --- Admin Job Approval / Moderation --- //
// List jobs with optional status filter (admin view)
app.get("/admin/jobs", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const jobs = await job.find(filter).sort({ _id: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching admin jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

// Approve or reject a job (admin only)
app.put("/admin/job/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    const valid = ["draft", "pending", "approved", "rejected"];
    if (!status || !valid.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const jobDoc = await job.findById(id);
    if (!jobDoc) return res.status(404).json({ message: "Job not found" });

    jobDoc.status = status;
    if (!jobDoc.created_by && jobDoc.email) jobDoc.created_by = jobDoc.email;
    await jobDoc.save();

    // Send notification email to business when approved/rejected
    if (transporter && (status === "approved" || status === "rejected")) {
      const subject = `Your job post has been ${status}`;
      const text = `Hello ${jobDoc.name || "Employer"},\n\nYour job posting (${jobDoc.basicDetails?.title || jobDoc.name}) has been ${status} by the admin.\n\n${admin_note || ""}\n\nRegards,\nAdmin`;
      try {
        await transporter.sendMail({ from: EMAIL_USER, to: jobDoc.email, subject, text });
      } catch (mailErr) {
        console.error("Failed to send job status email:", mailErr);
      }
    }

    // create in-app notification for business
    try {
      await Notification.create({
        to: jobDoc.email,
        type: 'job_moderation',
        title: `Job ${status}`,
        message: `Your job post (${jobDoc.basicDetails?.title || jobDoc.name}) has been ${status}`,
        data: { job_id: jobDoc._id.toString(), status },
      });
    } catch (nerr) {
      console.error('Failed to create notification for job status:', nerr);
    }

    res.json({ message: "Job status updated", job: jobDoc });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ message: "Failed to update job status" });
  }
});

// Basic logout endpoint
app.post("/auth/logout", (req, res) => {
  try {
    if (req.session) req.session.destroy(() => {});
    res.clearCookie("username");
    res.clearCookie("email");
    res.clearCookie("businessName");
    res.clearCookie("businessEmail");
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
});

// Notifications endpoints
app.get('/notifications', async (req, res) => {
  try {
    const { to, unreadOnly } = req.query;
    if (!to) return res.status(400).json({ message: 'to query param is required' });
    const filter = { to };
    if (unreadOnly === 'true') filter.read = false;
    const notes = await Notification.find(filter).sort({ created_at: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.post('/notifications/:id/read', async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    note.read = true;
    await note.save();
    res.json({ message: 'Marked read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all notifications read for a recipient
app.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'to is required in body' });
    const result = await Notification.updateMany({ to, read: false }, { $set: { read: true } });
    res.json({ message: 'Marked all read', matched: result.matchedCount || result.n, modified: result.modifiedCount || result.nModified });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ message: 'Failed to mark notifications' });
  }
});
