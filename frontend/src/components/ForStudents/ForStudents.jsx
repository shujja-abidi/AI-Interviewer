import React from "react";
import { Container, Typography, Grid, Paper, Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import SchoolIcon from '@mui/icons-material/School';
import FeedbackIcon from '@mui/icons-material/Feedback';
import TimelineIcon from '@mui/icons-material/Timeline';

const features = [
    {
        icon: <SchoolIcon fontSize="large" color="primary" />,
        title: "Practice Anytime",
        description: "No need to schedule with a human. Our AI is available 24/7 to help you practice.",
    },
    {
        icon: <FeedbackIcon fontSize="large" color="secondary" />,
        title: "Instant Feedback",
        description: "Get immediate, detailed analysis of your answers, including tone and body language.",
    },
    {
        icon: <TimelineIcon fontSize="large" color="success" />,
        title: "Track Progress",
        description: "Watch your confidence and scores improve over time with our detailed analytics.",
    },
];

const ForStudents = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Hero Section */}
                <Box sx={{ textAlign: "center", mb: 8 }}>
                    <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
                        Empowering Your Career Journey
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: "auto" }}>
                        Bridge the gap between campus and corporate. Our AI-driven platform prepares you for the toughest interviews so you can land your dream job.
                    </Typography>
                    <Button variant="contained" color="secondary" size="large" sx={{ mt: 4 }} href="/signup-candidate">
                        Start Practicing Now
                    </Button>
                </Box>

                {/* Features Grid */}
                <Grid container spacing={4} sx={{ mb: 8 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper elevation={3} sx={{ p: 4, height: '100%', textAlign: 'center', borderRadius: 4 }}>
                                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                <Typography variant="h5" gutterBottom fontWeight="bold">
                                    {feature.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {feature.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* How it Works */}
                <Box sx={{ bgcolor: "#e3f2fd", p: 6, borderRadius: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
                        How It Works
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" color="primary" gutterBottom>1. Create Profile</Typography>
                            <Typography>Sign up and upload your resume. Let our system parse your skills.</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                      <Typography variant="h6" color="primary" gutterBottom>2. Take Real-Time AI Interviews</Typography>
                            <Typography>Simulate real-world scenarios with our AI interviewer.</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" color="primary" gutterBottom>3. Get Hired</Typography>
                            <Typography>Use your improved skills and our network to find the perfect job.</Typography>
                        </Grid>
                    </Grid>
                </Box>
            </motion.div>
        </Container>
    );
};

export default ForStudents;
