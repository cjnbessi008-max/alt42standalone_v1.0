import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { routineAPI } from '../services/api';

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const [historyRes, statsRes] = await Promise.all([
        routineAPI.getHistory(userId, 50),
        routineAPI.getStatistics(userId),
      ]);

      setHistory(historyRes.data.data);
      setStatistics(statsRes.data.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            루틴 통계 및 기록
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Statistics Summary */}
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
                  완료율
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {statistics?.totalRoutines
                    ? Math.round((statistics.completedRoutines / statistics.totalRoutines) * 100)
                    : 0}
                  %
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

        {/* Routine History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              루틴 기록
            </Typography>
            <List>
              {history.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="루틴 기록이 없습니다"
                    secondary="첫 루틴을 시작해보세요!"
                  />
                </ListItem>
              ) : (
                history.map((record) => (
                  <ListItem
                    key={record.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemText
                      primary={record.routineType.nameKo}
                      secondary={
                        <>
                          {formatDate(record.createdAt)}
                          {record.rating && ` • ${record.rating}⭐`}
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {record.completed ? (
                        <Chip label="완료" color="success" size="small" />
                      ) : (
                        <Chip label="미완료" color="default" size="small" />
                      )}
                      <Chip label={record.routineType.category} size="small" variant="outlined" />
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default StatisticsPage;
