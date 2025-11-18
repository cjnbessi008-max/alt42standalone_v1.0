import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Button,
  Container,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  EventAvailable as EventAvailableIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useStore } from '../store';
import { ScoreTrendChart } from './ScoreTrendChart';
import { StudentList } from './StudentList';
import { ScoreCard } from './ScoreCard';
import { StudentComparisonTable } from './StudentComparisonTable';

export const Dashboard: React.FC = () => {
  const {
    students,
    selectedStudent,
    studentScores,
    scoreTrend,
    loading,
    error,
    fetchStudents,
    fetchLatestScores,
    selectStudent,
    recalculateScores,
  } = useStore();

  const [tabValue, setTabValue] = React.useState(0);

  useEffect(() => {
    fetchStudents();
    fetchLatestScores();
  }, [fetchStudents, fetchLatestScores]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRecalculate = async () => {
    await recalculateScores();
  };

  if (loading && students.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LMS 꾸준함 점수 대시보드
          </Typography>
          <Button
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={handleRecalculate}
            disabled={loading}
          >
            점수 재계산
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="개인별 분석" />
            <Tab label="전체 비교" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <StudentList
                students={students}
                selectedStudent={selectedStudent}
                onSelectStudent={selectStudent}
              />
            </Grid>

            <Grid item xs={12} md={9}>
              {selectedStudent && scoreTrend ? (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedStudent.name} ({selectedStudent.student_id})
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <ScoreCard
                        title="총점"
                        score={
                          scoreTrend.scores[scoreTrend.scores.length - 1]?.total_score || 0
                        }
                        icon={<TrendingUpIcon />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ScoreCard
                        title="출석"
                        score={
                          scoreTrend.scores[scoreTrend.scores.length - 1]?.attendance_score || 0
                        }
                        icon={<EventAvailableIcon />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ScoreCard
                        title="활동"
                        score={
                          scoreTrend.scores[scoreTrend.scores.length - 1]?.activity_score || 0
                        }
                        icon={<SchoolIcon />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <ScoreCard
                        title="과제"
                        score={
                          scoreTrend.scores[scoreTrend.scores.length - 1]?.submission_score || 0
                        }
                        icon={<AssignmentIcon />}
                      />
                    </Grid>
                  </Grid>

                  <ScoreTrendChart
                    scores={scoreTrend.scores}
                    title={`${selectedStudent.name}의 꾸준함 점수 추이`}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 400,
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    왼쪽에서 학생을 선택하세요
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Box>
            <StudentComparisonTable scores={studentScores} />
          </Box>
        )}
      </Container>
    </Box>
  );
};
