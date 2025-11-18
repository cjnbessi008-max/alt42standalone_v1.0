import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Switch,
  FormControlLabel,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  Chip,
} from '@mui/material';
import { School as SchoolIcon, Person as PersonIcon } from '@mui/icons-material';
import { ProblemList } from './components/ProblemList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isInstructorMode, setIsInstructorMode] = useState(false);

  const handleModeToggle = () => {
    setIsInstructorMode(!isInstructorMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <SchoolIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              LMS 문제 우선순위 체커
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isInstructorMode}
                  onChange={handleModeToggle}
                  color="default"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  {isInstructorMode ? (
                    <>
                      <PersonIcon sx={{ mr: 0.5 }} />
                      교수자 모드
                    </>
                  ) : (
                    <>
                      <SchoolIcon sx={{ mr: 0.5 }} />
                      학생 모드
                    </>
                  )}
                </Box>
              }
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 2, mb: 3, backgroundColor: isInstructorMode ? '#fff3e0' : '#e3f2fd' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  {isInstructorMode ? '👨‍🏫 교수자 모드' : '👨‍🎓 학생 모드'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isInstructorMode
                    ? '문제에 우선순위를 설정할 수 있습니다. 각 문제 카드의 메뉴(⋮)를 클릭하여 우선순위를 변경하세요.'
                    : '우선순위가 표시된 문제를 확인할 수 있습니다. 필터를 사용하여 원하는 문제를 찾아보세요.'}
                </Typography>
              </Box>
              <Chip
                label={isInstructorMode ? '편집 가능' : '읽기 전용'}
                color={isInstructorMode ? 'warning' : 'info'}
              />
            </Box>
          </Paper>

          <ProblemList isInstructorMode={isInstructorMode} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
