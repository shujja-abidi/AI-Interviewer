import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from '@mui/material';

const SignUp = () => {
  const navigate = useNavigate();

  const handleRedirect = (type) => {
    if (type === "candidate") {
      navigate("/signup-candidate");
    } else if (type === "business") {
      navigate("/signup-business");
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Typography variant="h5" align="center" gutterBottom>
          Choose Your Sign Up Type
        </Typography>

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => handleRedirect("candidate")}
            style={{ marginRight: "8px" }}
          >
            Sign Up as Candidate
          </Button>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => handleRedirect("business")}
          >
            Sign Up as Business
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
