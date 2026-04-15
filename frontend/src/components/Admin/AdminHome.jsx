import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { PYTHON_API_URL } from '../../config/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminHome = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${PYTHON_API_URL}/api/admin/stats`);
            const data = await response.json();
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return <Box display="flex" justifyItems="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
    }

    if (!stats) {
        return <Typography>Error loading stats.</Typography>;
    }

    const chartData = {
        labels: ['Candidates', 'Businesses', 'Interviews Today', 'AI Usage'],
        datasets: [
            {
                label: 'Platform Metrics',
                data: [stats.candidates, stats.businesses, stats.interviews_today, stats.ai_usage],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
            },
        ],
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Platform Analytics</Typography>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Total Candidates</Typography>
                        <Typography variant="h3" color="primary">{stats.candidates}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Total Businesses</Typography>
                        <Typography variant="h3" color="secondary">{stats.businesses}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Interviews </Typography>
                        <Typography variant="h3" color="warning.main">{stats.interviews_today}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">AI Usage (Calls)</Typography>
                        <Typography variant="h3" color="info.main">{stats.ai_usage}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Activity Overview</Typography>
                <Box height={400}>
                    <Bar options={{ maintainAspectRatio: false }} data={chartData} />
                </Box>
            </Paper>
        </Box>
    );
};

export default AdminHome;
