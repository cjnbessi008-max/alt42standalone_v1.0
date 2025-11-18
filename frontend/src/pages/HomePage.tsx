import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Container,
} from '@mui/material';
import FunctionsIcon from '@mui/icons-material/Functions';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          AI Education System
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          AI 기반 수학 교육 플랫폼
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <FunctionsIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <Typography gutterBottom variant="h5" component="h2" align="center">
                Inverse Reflection
              </Typography>
              <Typography align="center" color="text.secondary">
                역함수를 거울 반사처럼 시각화하여 직관적으로 이해할 수 있습니다.
                y=x 선을 기준으로 원함수와 역함수의 관계를 탐색하세요.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button
                component={RouterLink}
                to="/inverse-reflection"
                variant="contained"
                size="large"
              >
                시작하기
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <AutoGraphIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
              </Box>
              <Typography gutterBottom variant="h5" component="h2" align="center">
                Interactive Graphing
              </Typography>
              <Typography align="center" color="text.secondary">
                실시간으로 그래프를 조작하고, 수학적 개념을 시각적으로 탐구합니다.
                (개발 예정)
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button variant="outlined" size="large" disabled>
                Coming Soon
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <SmartToyIcon sx={{ fontSize: 60, color: 'success.main' }} />
              </Box>
              <Typography gutterBottom variant="h5" component="h2" align="center">
                AI-Powered Learning
              </Typography>
              <Typography align="center" color="text.secondary">
                Claude AI가 생성하는 맞춤형 학습 모듈로 효과적인 수학 교육을 경험하세요.
                (개발 예정)
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button variant="outlined" size="large" disabled>
                Coming Soon
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          🎯 Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" paragraph>
              ✅ <strong>실시간 시각화</strong>: HTML5 Canvas로 부드러운 애니메이션
            </Typography>
            <Typography variant="body1" paragraph>
              ✅ <strong>AI 문제 생성</strong>: Claude가 자동으로 문제 생성
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" paragraph>
              ✅ <strong>진도 추적</strong>: 학생별 학습 분석 및 리포트
            </Typography>
            <Typography variant="body1" paragraph>
              ✅ <strong>Moodle 연동</strong>: LMS와 완벽한 통합
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;
