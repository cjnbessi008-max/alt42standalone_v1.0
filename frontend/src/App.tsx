import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
} from '@mui/material';
import { School } from '@mui/icons-material';
import StudentSelector from './components/StudentSelector';
import StatisticsCard from './components/Timeline/StatisticsCard';
import TimelineChart from './components/Timeline/TimelineChart';
import TimelineList from './components/Timeline/TimelineList';
import { timelineApi } from './services/api';
import { Student, StudentTimeline } from './types/timeline';

// Create MUI theme with Korean-friendly fonts
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
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [timeline, setTimeline] = useState<StudentTimeline | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load students on mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await timelineApi.getStudents();
        setStudents(studentsData);

        // Auto-select first student
        if (studentsData.length > 0) {
          setSelectedStudentId(studentsData[0].id);
        }
      } catch (err) {
        setError('학생 목록을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Load timeline when student is selected
  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedStudentId) return;

      try {
        setLoading(true);
        setError(null);
        const timelineData = await timelineApi.getStudentTimeline(selectedStudentId);
        setTimeline(timelineData);
      } catch (err) {
        setError('타임라인 데이터를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [selectedStudentId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            학생 풀이 루틴 타임라인
          </Typography>
          <Typography variant="body2">
            KAIST Touch Math Academy
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            📚 학생 학습 타임라인
          </Typography>
          <Typography variant="body1" color="text.secondary">
            학생의 문제 풀이 과정과 학습 진행 상황을 시간 순서로 확인하세요
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Student Selector */}
        <Box sx={{ mb: 4 }}>
          {students.length > 0 && (
            <StudentSelector
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Timeline Display */}
        {!loading && timeline && (
          <Stack spacing={4}>
            {/* Student Info */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                👨‍🎓 {timeline.student.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                학년: {timeline.student.grade_level} | 이메일: {timeline.student.email}
              </Typography>
            </Box>

            {/* Statistics */}
            <StatisticsCard statistics={timeline.statistics} />

            {/* Charts */}
            {timeline.events.filter(e => e.event_type === 'attempt').length > 0 && (
              <TimelineChart events={timeline.events} />
            )}

            {/* Timeline List */}
            <TimelineList events={timeline.events} />
          </Stack>
        )}

        {/* No Data State */}
        {!loading && !timeline && students.length === 0 && (
          <Alert severity="info">
            등록된 학생이 없습니다. 데이터베이스에 샘플 데이터를 추가하세요.
          </Alert>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
