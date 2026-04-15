import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography, Box } from "@mui/material";
import { Link } from "@mui/material"; // Add Link to your MUI imports
import { NODE_API_URL } from "../../config/api";
import { setAuthSession } from "../../utility/auth";

const LoginCandidate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${NODE_API_URL}/logincand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setAuthSession({
          role: "candidate",
          name: result.user?.name || "",
          email: result.user?.email || formData.email,
        });
        navigate("/candidate/home");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Unable to connect to the server");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Login as Candidate
        </Typography>
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          {/* Forgot Password Link */}
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate("/forgot-password")}
              sx={{ textDecoration: 'none' }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </form>

        {/* Sign Up Link */}
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Don't have an account?{" "}
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate("/signup-candidate")} // Ensure this route matches your App.js
              sx={{ fontWeight: 'bold', textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>


       
      </Box>
    </Box>
  );
};

export default LoginCandidate;
