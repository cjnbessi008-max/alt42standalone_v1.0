import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { checklistApi } from '../services/api';
import { Checklist } from '../types/checklist';

export const StudentDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadChecklists();
    }
  }, [studentId]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApi.getStudentChecklists(studentId!);
      setChecklists(data);
    } catch (err) {
      setError('Failed to load checklists');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (checklist: Checklist) => {
    return checklist.total_items > 0
      ? (checklist.completed_items / checklist.total_items) * 100
      : 0;
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" mb={1}>
          My Learning Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress through educational modules
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Checklists Grid */}
      {checklists.length === 0 ? (
        <Alert severity="info">
          No learning modules assigned yet. Check back later!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist);
            return (
              <Grid item xs={12} sm={6} md={4} key={checklist.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" mb={2}>
                      {checklist.title}
                    </Typography>

                    {checklist.description && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {checklist.description}
                      </Typography>
                    )}

                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        {checklist.completed_items} / {checklist.total_items} completed
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />

                    <Box mt={1} textAlign="right">
                      <Typography variant="caption" fontWeight="bold">
                        {progress.toFixed(0)}%
                      </Typography>
                    </Box>

                    {progress === 100 && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        ✓ Completed!
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/student/checklist/${checklist.id}`)}
                    >
                      {progress === 100 ? 'Review' : 'Continue Learning'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};
