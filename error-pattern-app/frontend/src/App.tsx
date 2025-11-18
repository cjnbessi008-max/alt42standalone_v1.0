import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ErrorReasonSelector } from './components/ErrorReasonSelector';
import { PatternDashboard } from './components/PatternDashboard';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#e74c3c',
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
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<PatternDashboard />} />
            <Route
              path="/error-reason"
              element={
                <ErrorReasonSelector
                  questionError={{
                    id: 1,
                    attemptId: 1,
                    userId: 1,
                    moodleQuestionId: 1,
                    questionText: '2 + 2 = ?',
                    correctAnswer: '4',
                    studentAnswer: '5',
                    isCorrect: false,
                    createdAt: new Date().toISOString(),
                  }}
                  onSubmit={() => console.log('Submitted')}
                />
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
