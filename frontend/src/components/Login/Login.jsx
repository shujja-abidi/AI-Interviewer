import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Box } from "@mui/material";

const Login = () => {
  const navigate = useNavigate();

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Choose Login Type
        </Typography>
        <Box mt={4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/login-candidate")}
          >
            Login as Candidate
          </Button>
        </Box>
        <Box mt={2}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => navigate("/login-business")}
          >
            Login as Business
          </Button>
        </Box>

        <Box mt={2}>
          <Button
            variant="outlined"
            color="error" // Red color for admin
            fullWidth
            onClick={() => navigate("/login-admin")}
          >
            Login as Admin
          </Button>
        </Box>


      </Box>
    </Box>
  );
};

export default Login;
