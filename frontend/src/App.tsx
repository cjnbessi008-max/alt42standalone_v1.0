import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import InverseReflectionPage from './pages/InverseReflectionPage';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🧮 AI Education System
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inverse-reflection" element={<InverseReflectionPage />} />
          <Route path="/inverse-reflection/:problemId" element={<InverseReflectionPage />} />
        </Routes>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          AI Education System © 2024 - Powered by Claude AI
        </Typography>
      </Box>
    </Box>
  );
};

export default App;
