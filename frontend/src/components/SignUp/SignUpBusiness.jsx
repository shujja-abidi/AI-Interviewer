import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography, Box } from "@mui/material";
import { NODE_API_URL } from "../../config/api";
import { setAuthSession } from "../../utility/auth";

const SignUpBusiness = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
  });
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${NODE_API_URL}/registerbuss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, address }),
      });

      const result = await response.json();

      if (response.ok) {
        setAuthSession({
          role: "business",
          name: result.user.name,
          email: result.user.email,
        });
        
        navigate("/business/home");
      } else {
        setError(result.message || "Signup failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Unable to connect to the server. Please try again later.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Sign Up as Business
        </Typography>

        {error && (
          <div style={{ color: "red", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <TextField
            label="Name"
            fullWidth
            required
            margin="normal"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            fullWidth
            required
            type="email"
            margin="normal"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            fullWidth
            required
            type="password"
            margin="normal"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            label="Contact"
            fullWidth
            required
            type="text"
            margin="normal"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
          />
          <TextField
            label="Address"
            fullWidth
            required
            margin="normal"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button type="submit" variant="contained" color="secondary" fullWidth>
            Sign Up
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Already have an account?{" "}
            <span className="text-primary cursor-pointer" onClick={() => navigate("/login-business")}>
              Login
            </span>
          </Typography>
        </Box>

        {/* <Box my={3} display="flex" alignItems="center">
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mx: 2 }}>OR</Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box> */}

        {/* <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<FaGoogle />}
          onClick={() => (window.location.href = "http://localhost:5000/auth/google/callback")}
        >
          Continue with Google
        </Button> */}
      </Box>
    </Box>
  );
};

export default SignUpBusiness;
