import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Argument, ProgressStats } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [arguments, setArguments] = useState<Argument[]>([]);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [argsResponse, progressResponse] = await Promise.all([
        api.getArguments({ limit: 5 }),
        api.getProgress(),
      ]);

      if (argsResponse.success && argsResponse.data) {
        setArguments(argsResponse.data);
      }

      if (progressResponse.success && progressResponse.data) {
        setProgress(progressResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          안녕하세요, {user?.full_name || user?.username}님!
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          로그아웃
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    총 논증
                  </Typography>
                  <Typography variant="h4">{progress?.total_arguments || 0}</Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    평균 점수
                  </Typography>
                  <Typography variant="h4">
                    {progress?.average_confidence_score
                      ? (progress.average_confidence_score * 100).toFixed(0)
                      : 0}
                    %
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    현재 연속
                  </Typography>
                  <Typography variant="h4">{progress?.current_streak || 0}일</Typography>
                </Box>
                <TrophyIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  숙련도
                </Typography>
                <Chip
                  label={progress?.mastery_level || 'beginner'}
                  color={
                    progress?.mastery_level === 'expert'
                      ? 'success'
                      : progress?.mastery_level === 'advanced'
                      ? 'primary'
                      : progress?.mastery_level === 'intermediate'
                      ? 'info'
                      : 'default'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Argument Button */}
      <Box mb={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/submit')}
          fullWidth
        >
          새로운 논증 제출하기
        </Button>
      </Box>

      {/* Recent Arguments */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          최근 제출한 논증
        </Typography>

        {arguments.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            아직 제출한 논증이 없습니다. 첫 번째 논증을 제출해보세요!
          </Typography>
        ) : (
          <Box>
            {arguments.map((arg) => (
              <Card
                key={arg.id}
                sx={{ mb: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/argument/${arg.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box flex={1}>
                      <Typography variant="h6">{arg.title || '제목 없음'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {arg.content.substring(0, 150)}
                        {arg.content.length > 150 ? '...' : ''}
                      </Typography>
                      <Box mt={2}>
                        <Chip label={arg.subject} size="small" sx={{ mr: 1 }} />
                        <Chip
                          label={arg.status}
                          size="small"
                          color={
                            arg.status === 'completed'
                              ? 'success'
                              : arg.status === 'analyzing'
                              ? 'info'
                              : 'default'
                          }
                        />
                      </Box>
                    </Box>
                    {arg.confidence_score && (
                      <Box textAlign="right" ml={2}>
                        <Typography variant="h6" color="primary">
                          {(arg.confidence_score * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          정확도
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;
