/**
 * Main Application Component
 * Integrates Color Partition feature with Virtual Smartphone Screen
 */
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button } from '@mui/material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import ColorPartition from './components/ColorPartition/ColorPartition';
import VirtualPhone from './components/VirtualPhone/VirtualPhone';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [showVirtualPhone, setShowVirtualPhone] = useState(true);
  const [isPhoneMinimized, setIsPhoneMinimized] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold', color: '#1976d2' }}
            >
              AI Education System
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Color Partition - 함수 구간 색깔 분석
            </Typography>
            <Typography variant="body1" color="text.secondary">
              수학 함수의 증가/감소, 오목/볼록 구간을 색깔로 시각화합니다.
            </Typography>
          </Box>

          {/* Main Content */}
          <ColorPartition />

          {/* Toggle Virtual Phone Button */}
          <Box sx={{ textAlign: 'center', marginTop: 4 }}>
            <Button
              variant="outlined"
              startIcon={<SmartphoneIcon />}
              onClick={() => setShowVirtualPhone(!showVirtualPhone)}
            >
              {showVirtualPhone ? '가상 스마트폰 숨기기' : '가상 스마트폰 보기'}
            </Button>
          </Box>
        </Container>

        {/* Virtual Smartphone Screen */}
        {showVirtualPhone && (
          <VirtualPhone
            isMinimized={isPhoneMinimized}
            onMinimize={() => setIsPhoneMinimized(!isPhoneMinimized)}
            onClose={() => setShowVirtualPhone(false)}
          >
            <ColorPartition />
          </VirtualPhone>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
