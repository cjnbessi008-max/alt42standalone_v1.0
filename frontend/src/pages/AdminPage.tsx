import React from 'react';
import { Container, Box, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            관리자 대시보드
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          관리자 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          이 페이지는 개발 중입니다. 향후 사용자 관리, 루틴 관리, 시스템 설정 등의 기능이 추가됩니다.
        </Typography>
      </Container>
    </Box>
  );
};

export default AdminPage;
