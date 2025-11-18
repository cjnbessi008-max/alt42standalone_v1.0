/**
 * 메인 앱 컴포넌트
 */
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Home } from '@mui/icons-material';
import StudentList from './pages/StudentList';
import StudentDashboard from './pages/StudentDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const handleGoHome = () => {
    setSelectedStudentId(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          {selectedStudentId && (
            <Button color="inherit" startIcon={<Home />} onClick={handleGoHome}>
              홈
            </Button>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            성공 루틴 카드 시스템
          </Typography>
        </Toolbar>
      </AppBar>

      <main>
        {selectedStudentId ? (
          <StudentDashboard studentId={selectedStudentId} />
        ) : (
          <StudentList onSelectStudent={handleSelectStudent} />
        )}
      </main>
    </ThemeProvider>
  );
}

export default App;
