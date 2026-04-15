import React from "react";
import { Container, Typography, Grid, Card, CardContent, CardMedia, Box, Button } from "@mui/material";
import { motion } from "framer-motion";

const resources = [
    {
        title: "Mastering Body Language",
        description: "Learn how non-verbal cues impact your interview performance. Our guide covers eye contact, posture, and hand gestures to help you project confidence.",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    },
    {
        title: "Top 50 Technical Questions",
        description: "A comprehensive list of common coding and system design questions from top tech companies. Practice these to ace your technical rounds with ease.",
        image: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=600&q=80",
    },
    {
        title: "Beating the ATS",
        description: "Optimize your resume to get past Applicant Tracking Systems. Learn keywords, formatting tips, and strategies to ensure your resume is seen by recruiters.",
        image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80",
    },
];

const Resources = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: "bold", mb: 6 }}>
                    Interview Resources Library
                </Typography>

                <Grid container spacing={4}>
                    {resources.map((resource, index) => (
                        <Grid item xs={12} md={4} key={index} sx={{ display: 'flex' }}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={resource.image}
                                    alt={resource.title}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
                                        {resource.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resource.description}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 2 }}>
                                    <Button variant="outlined" color="primary" fullWidth>Read Guide</Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 10, textAlign: "center", bgcolor: "#f5f5f5", p: 6, borderRadius: 4 }}>
                    <Typography variant="h4" gutterBottom>Video Tutorials</Typography>
                    <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
                        Watch our expert coaches utilize the AI Interviewer platform to demonstrate perfect answers.
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item>
                            <Button variant="contained" size="large" color="secondary">Watch Tutorials</Button>
                        </Grid>
                    </Grid>
                </Box>
            </motion.div>
        </Container>
    );
};

export default Resources;
