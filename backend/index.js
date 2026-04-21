const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // For parsing cookies
require("./db/config");
const bcrypt = require("bcryptjs");
const user = require("./db/user");
const business = require("./db/business");
const job = require("./db/job");
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

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await user.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set session
    req.session.user = {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.name,
    };

    // Set cookies
    res.cookie("username", existingUser.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie("email", existingUser.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        name: existingUser.name,
        email: existingUser.email,
      },
      redirectTo: "/candidate/home", // Add redirect URL in response
    });
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
    const jobs = await job.find();
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
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

// Admin Routes

// Admin Login
app.post("/loginadmin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Set admin session/cookie if needed, or just return success for simple auth
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
app.get("/api/admin/users", async (req, res) => {
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
app.delete("/api/admin/user/:type/:id", async (req, res) => {
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
app.put("/api/admin/user/:type/:id", async (req, res) => {
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



app.listen(NODE_API_PORT, () => {
  console.log(`Server is running on port ${NODE_API_PORT}`);
});
