/**
 * Main Application Component
 * Routes between Student View and Teacher Dashboard
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography } from '@mui/material';
import StudentView from './pages/StudentView';
import TeacherDashboard from './pages/TeacherDashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    // Parse URL parameters (from LTI launch or direct access)
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    const student = params.get('student');
    const mode = params.get('mode');

    if (session) setSessionId(parseInt(session));
    if (student) setStudentId(parseInt(student));
    if (mode === 'teacher') setViewMode('teacher');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* App Bar */}
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                DMN Drift Tracker
              </Typography>
              <Typography variant="body2">
                {viewMode === 'teacher' ? 'Teacher Dashboard' : 'Student View'}
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Routes>
              <Route
                path="/"
                element={
                  viewMode === 'teacher' ? (
                    <TeacherDashboard studentId={studentId || undefined} />
                  ) : (
                    <StudentView
                      studentId={studentId || 1}
                      moduleName="Learning Module"
                    />
                  )
                }
              />
              <Route
                path="/student"
                element={
                  <StudentView
                    studentId={studentId || 1}
                    moduleName="Learning Module"
                  />
                }
              />
              <Route
                path="/teacher"
                element={<TeacherDashboard studentId={studentId || undefined} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>

          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 2,
              px: 2,
              mt: 'auto',
              backgroundColor: (theme) => theme.palette.grey[200],
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              DMN Drift Quantification System © {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
