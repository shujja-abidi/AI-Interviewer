import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography, Box } from "@mui/material";
import { Link } from "@mui/material"; // Add Link to imports
import { NODE_API_URL } from "../../config/api";
import { setAuthSession } from "../../utility/auth";

const LoginBusiness = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    console.log("this is login");
    
    e.preventDefault();
    setError(""); // Clear any previous errors

    try {
      const response = await fetch(`${NODE_API_URL}/loginbuss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      console.log("this is also login");
      
      const result = await response.json();
      if (response.ok) {
        setAuthSession({
          role: "business",
          name: result.business.name,
          email: result.business.email,
        });

        console.log("Login successful:", result);
        
        setTimeout(() => {
          navigate("/business/home");
        }, 100);
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Unable to connect to the server. Please try again later.");
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Login as Business
        </Typography>

        {/* Display Error Message */}
        {error && (
          <Typography color="error" align="center" gutterBottom>
            {error}
          </Typography>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Field */}
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          
<Box sx={{ textAlign: 'right', mb: 2 }}>
  <Link 
    component="button" 
    variant="body2" 
    onClick={() => navigate("/forgot-password", { state: { role: "business" } })}
    sx={{ textDecoration: 'none' }}
  >
    Forgot Password?
  </Link>
</Box>


          {/* Login Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginTop: "16px" }}
          >
            Login
          </Button>
        </form>

        {/* Redirect to Sign Up */}
        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Don't have an account?{" "}
            <span
              className="text-primary cursor-pointer"
              onClick={() => navigate("/signup-business")}
            >
              Sign Up
            </span>
          </Typography>
        </Box>

        
      </Box>
    </Box>
  );
};

export default LoginBusiness;
