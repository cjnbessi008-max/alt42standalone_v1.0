import { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { School, CheckCircle, Timer, TrendingUp } from '@mui/icons-material';
import { analyticsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    analyticsAPI.getDashboard().then(res => setStats(res.data.stats || {})).catch(() => {});
  }, []);

  const statCards = [
    { title: 'Attempted', value: stats?.total_attempted || 0, icon: <School />, color: '#667eea' },
    { title: 'Solved', value: stats?.total_solved || 0, icon: <CheckCircle />, color: '#4ade80' },
    { title: 'Avg Score', value: `${(stats?.avg_score || 0).toFixed(1)}%`, icon: <TrendingUp />, color: '#fbbf24' },
    { title: 'Time Spent', value: `${Math.floor((stats?.total_time || 0) / 60)}min`, icon: <Timer />, color: '#f87171' },
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Your learning dashboard
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                    <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
                  </Box>
                  <Box sx={{ color: card.color, fontSize: 48 }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
