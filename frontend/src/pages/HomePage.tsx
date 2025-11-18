/**
 * Home Page - Landing page with navigation
 */

import React from 'react';
import { Container, Typography, Box, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          DMN 상태 모니터링 시스템
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Default Mode Network Status Monitoring System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 3 }}>
          실시간으로 학습 집중도를 색상으로 확인하고, Moodle LMS와 연동하여 학습 효과를 극대화하세요.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate('/student/demo-student-123')}
          >
            <PersonIcon sx={{ fontSize: 80, color: '#2196F3', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              학생 대시보드
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              내 학습 집중도를 실시간으로 확인하고, 학습 패턴을 분석합니다.
            </Typography>
            <Button variant="contained" size="large" sx={{ mt: 2 }}>
              학생으로 시작하기
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              },
            }}
            onClick={() => navigate('/teacher/demo-course-456')}
          >
            <SchoolIcon sx={{ fontSize: 80, color: '#00C853', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              교사 대시보드
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              학급 전체의 학습 집중도를 모니터링하고, 개별 학생을 지원합니다.
            </Typography>
            <Button variant="contained" color="secondary" size="large" sx={{ mt: 2 }}>
              교사로 시작하기
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          색상 코드 가이드
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#00C853' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>깊은 집중</Typography>
                <Typography variant="caption" color="text.secondary">Deep Focus</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#2196F3' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>활동적 학습</Typography>
                <Typography variant="caption" color="text.secondary">Active Learning</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFC107' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>주의 분산</Typography>
                <Typography variant="caption" color="text.secondary">Wandering</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#F44336' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>이탈</Typography>
                <Typography variant="caption" color="text.secondary">Disengaged</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;
