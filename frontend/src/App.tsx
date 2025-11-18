import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import MetacognitionMirror from './components/MetacognitionMirror';
import { useMetacognitionStore } from './hooks/useMetacognitionStore';
import { socketService } from './services/socketService';

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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

function App() {
  const [studentId] = useState('student_demo_001'); // In production, get from auth
  const { setMetacognitionState } = useMetacognitionStore();

  useEffect(() => {
    // Connect to WebSocket server
    socketService.connect();

    // Identify student
    socketService.identify(studentId);

    // Listen for metacognition updates
    socketService.onMetacognitionUpdate((state) => {
      setMetacognitionState(state);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [studentId, setMetacognitionState]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              메타인지 미러 - "지금 뭘 하고 있지?"
            </Typography>
            <Typography variant="body2">
              Student: {studentId}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <MetacognitionMirror studentId={studentId} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
