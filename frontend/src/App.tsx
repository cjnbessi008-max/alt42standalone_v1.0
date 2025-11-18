import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PhoneFrame from './components/PhoneFrame/PhoneFrame';
import LengthAssistModule from './components/LengthAssist/LengthAssistModule';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
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
  // These would normally come from URL params or authentication
  const moduleId = 'demo-module-1';
  const studentId = 'demo-student-1';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PhoneFrame showFrame={true}>
        <LengthAssistModule moduleId={moduleId} studentId={studentId} />
      </PhoneFrame>
    </ThemeProvider>
  );
}

export default App;
