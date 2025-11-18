import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, Button } from '@mui/material';
import VirtualSmartphone from './components/VirtualSmartphone/VirtualSmartphone';
import { GraphData } from './types/graph';
import { sampleGraphData } from './data/sampleGraphData';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const handleStartAnimation = () => {
    setGraphData(sampleGraphData);
    setShowGraph(true);
  };

  const handleReset = () => {
    setShowGraph(false);
    setTimeout(() => {
      setGraphData(null);
    }, 300);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              mb: 2
            }}
          >
            One-Second Graph
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              mb: 3,
              fontWeight: 300
            }}
          >
            KAIST Touch Math Academy - AI Education System
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartAnimation}
              disabled={showGraph}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              Show Graph Animation
            </Button>
            {showGraph && (
              <Button
                variant="outlined"
                size="large"
                onClick={handleReset}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <VirtualSmartphone graphData={graphData} showGraph={showGraph} />
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem'
            }}
          >
            This demo shows a concept graph animated in 1 second on a virtual smartphone display
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
