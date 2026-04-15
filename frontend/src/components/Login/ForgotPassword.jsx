import React, { useState } from "react";
import { Button, TextField, Typography, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { state } = useLocation();
  const role = state?.role || "candidate"; // Default to candidate

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setStep(2);
        setMessage("OTP sent to your email.");
        setError("");
      } else {
        setError("Email not found or server error.");
      }
    } catch {
      setError("Network error.");
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        setStep(3);
        setMessage("OTP verified. Please enter new password.");
        setError("");
      } else {
        setError("Invalid OTP.");
      }
    } catch {
      setError("Network error.");
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (response.ok) {
        alert("Password reset successfully! Please login.");
        navigate(role === "business" ? "/login-business" : "/login-candidate");
      } else {
        setError("Failed to reset password.");
      }
    } catch {
      setError("Network error.");
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Reset Password
        </Typography>

        {message && <Typography color="primary" align="center" mb={2}>{message}</Typography>}
        {error && <Typography color="error" align="center" mb={2}>{error}</Typography>}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <>
            <TextField
              label="Enter your email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" color="primary" fullWidth onClick={handleSendOtp} sx={{ mt: 2 }}>
              Send OTP
            </Button>
          </>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <>
            <TextField
              label="Enter OTP"
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" color="primary" fullWidth onClick={handleVerifyOtp} sx={{ mt: 2 }}>
              Verify OTP
            </Button>
          </>
        )}

        {/* Step 3: New Password Input */}
        {step === 3 && (
          <>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" color="success" fullWidth onClick={handleResetPassword} sx={{ mt: 2 }}>
              Save New Password
            </Button>
          </>
        )}
        
        <Box mt={2} textAlign="center">
            <Button onClick={() => navigate(role === "business" ? "/login-business" : "/login-candidate")} color="secondary">
                Back to Login
            </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
