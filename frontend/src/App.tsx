import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Dashboard from './components/Dashboard/Dashboard';
import SmartphoneSimulator from './components/SmartphoneSimulator/SmartphoneSimulator';
import CorrelationHeatmap from './components/CorrelationHeat/CorrelationHeatmap';
import { CorrelationData } from './types';
import apiService from './services/api';

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
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedQuizId) {
      loadCorrelationData(selectedQuizId);
    }
  }, [selectedQuizId]);

  const loadCorrelationData = async (quizId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getCorrelationData(quizId);
      setCorrelationData(data);
    } catch (error) {
      console.error('Failed to load correlation data:', error);
      setCorrelationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelected = (quizId: number) => {
    setSelectedQuizId(quizId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Dashboard
          onQuizSelected={handleQuizSelected}
          selectedQuizId={selectedQuizId}
        />

        {/* Smartphone Simulator with Correlation Heatmap */}
        {correlationData && !loading && (
          <SmartphoneSimulator>
            <CorrelationHeatmap data={correlationData} />
          </SmartphoneSimulator>
        )}

        {loading && selectedQuizId && (
          <SmartphoneSimulator>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              Loading...
            </Box>
          </SmartphoneSimulator>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
