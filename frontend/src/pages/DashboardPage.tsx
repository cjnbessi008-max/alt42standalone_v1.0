import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { routineAPI, userAPI } from '../services/api';
import { setRoutineTypes, setStatistics, setCurrentRoutine, setShowRoutineModal } from '../store/slices/routineSlice';
import { setUser } from '../store/slices/userSlice';
import LogoutIcon from '@mui/icons-material/Logout';
import SelfCareIcon from '@mui/icons-material/SelfImprovement';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RoutineModal from '../components/RoutineModal';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { routineTypes, statistics, showRoutineModal } = useSelector((state: RootState) => state.routine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    loadData(userId);
  }, [navigate]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);

      // Load user if not in store
      if (!currentUser) {
        const userResponse = await userAPI.getUser(userId);
        dispatch(setUser(userResponse.data.data));
      }

      // Load routine types
      const typesResponse = await routineAPI.getTypes();
      dispatch(setRoutineTypes(typesResponse.data.data));

      // Load statistics
      const statsResponse = await routineAPI.getStatistics(userId);
      if (statsResponse.data.data) {
        dispatch(setStatistics(statsResponse.data.data));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleStartRoutine = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // Get recommended routine
      const response = await routineAPI.getRecommendation(userId);
      const recommendedRoutine = response.data.data;

      // Start routine
      const startResponse = await routineAPI.startRoutine({
        userId,
        routineTypeId: recommendedRoutine.id,
        triggerReason: 'manual',
      });

      dispatch(setCurrentRoutine(startResponse.data.data));
      dispatch(setShowRoutineModal(true));
    } catch (error) {
      console.error('Error starting routine:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      breathing: '🫁',
      meditation: '🧘',
      stretching: '💪',
      break: '⏰',
      message: '💬',
    };
    return icons[category] || '✨';
  };

  const getCategoryName = (category: string) => {
    const names: any = {
      breathing: '호흡 운동',
      meditation: '명상',
      stretching: '스트레칭',
      break: '휴식',
      message: '긍정 메시지',
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  // Group routines by category
  const routinesByCategory = routineTypes.reduce((acc: any, routine) => {
    if (!acc[routine.category]) {
      acc[routine.category] = [];
    }
    acc[routine.category].push(routine);
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <SelfCareIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            정신 완화 루틴
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentUser?.fullName || '사용자'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            안녕하세요, {currentUser?.fullName}님! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            오늘도 학습을 시작하셨네요. 건강한 휴식도 잊지 마세요!
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  총 루틴 수
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {statistics?.totalRoutines || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  완료 루틴
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {statistics?.completedRoutines || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  총 시간 (분)
                </Typography>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {Math.round((statistics?.totalDuration || 0) / 60)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  평균 평점
                </Typography>
                <Typography variant="h4" fontWeight={600} color="secondary.main">
                  {statistics?.averageRating?.toFixed(1) || '-'} ⭐
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartRoutine}
              sx={{ py: 2 }}
            >
              추천 루틴 시작
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/statistics')}
              sx={{ py: 2 }}
            >
              루틴 기록 보기
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<BarChartIcon />}
              onClick={() => navigate('/statistics')}
              sx={{ py: 2 }}
            >
              통계 보기
            </Button>
          </Grid>
        </Grid>

        {/* Available Routines by Category */}
        <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
          사용 가능한 루틴
        </Typography>

        {Object.entries(routinesByCategory).map(([category, routines]: any) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={500}>
                {getCategoryIcon(category)} {getCategoryName(category)}
              </Typography>
              <Chip
                label={`${routines.length}개`}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            <Grid container spacing={2}>
              {routines.map((routine: any) => (
                <Grid item xs={12} sm={6} md={4} key={routine.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {routine.nameKo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {routine.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`${routine.duration}초`} size="small" />
                        <Chip label={routine.difficulty} size="small" color="primary" variant="outlined" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Container>

      {/* Routine Modal */}
      <RoutineModal />
    </Box>
  );
};

export default DashboardPage;
