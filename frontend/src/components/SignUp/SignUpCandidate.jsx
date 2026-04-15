import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography, Box } from "@mui/material";
import { NODE_API_URL } from "../../config/api";
import { setAuthSession } from "../../utility/auth";

const SignUpCandidate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${NODE_API_URL}/registercand`, {
        method: "POST",
        body: JSON.stringify({ ...formData, contact, type: "candidate" }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      
      if (response.ok) {
        setAuthSession({
          role: "candidate",
          name: result.user.name,
          email: result.user.email,
        });

        navigate("/candidate/home");
      } else {
        setError(result.message || "An unexpected error occurred.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to connect to the server. Please try again later.");
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Sign Up as Candidate
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            required
            type="email"
            margin="normal"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Password"
            fullWidth
            required
            type="password"
            margin="normal"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <TextField
            label="Contact"
            fullWidth
            required
            type="text"
            margin="normal"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign Up
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Already have an account?{" "}
            <span className="text-primary cursor-pointer" onClick={() => navigate("/login-candidate")}>
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

export default SignUpCandidate;
