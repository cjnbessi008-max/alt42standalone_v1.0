/**
 * Main Application Component
 */
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, AppBar, Toolbar, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { TransformVector } from './components/TransformVector/TransformVector';
import { VirtualPhone } from './components/VirtualPhone/VirtualPhone';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#4CAF50',
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

type ViewMode = 'desktop' | 'phone';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', background: '#f5f5f5' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ALT42 교육 시스템 - Transform Vector
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              aria-label="view mode"
              size="small"
              sx={{ ml: 2 }}
            >
              <ToggleButton value="desktop" aria-label="desktop view">
                <DesktopWindowsIcon sx={{ mr: 1 }} />
                데스크톱
              </ToggleButton>
              <ToggleButton value="phone" aria-label="phone view">
                <PhoneAndroidIcon sx={{ mr: 1 }} />
                스마트폰
              </ToggleButton>
            </ToggleButtonGroup>
          </Toolbar>
        </AppBar>

        {viewMode === 'desktop' ? (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <TransformVector />
          </Container>
        ) : (
          <>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" gutterBottom>
                  가상 스마트폰 디스플레이
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  우측 하단에 스마트폰 화면으로 앱이 표시됩니다
                </Typography>
              </Box>
            </Container>
            <VirtualPhone position="bottom-right">
              <TransformVector />
            </VirtualPhone>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
