import { Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import StudentAnalysis from './pages/StudentAnalysis';
import ClassAnalysis from './pages/ClassAnalysis';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LMS 확신 오답 분석 시스템
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/student/:userId" element={<StudentAnalysis />} />
          <Route path="/class/:courseId" element={<ClassAnalysis />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
