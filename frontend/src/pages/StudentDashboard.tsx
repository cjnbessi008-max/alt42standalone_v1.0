/**
 * Student Dashboard Page
 * Main page for students to view and complete daily missions
 */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DailyProblemCard from '../components/DailyProblemCard';
import StreakDisplay from '../components/StreakDisplay';
import apiService from '../services/api';

const StudentDashboard: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // TODO: Get from authentication context
  const studentId = localStorage.getItem('student_id') || 'demo-student-id';

  useEffect(() => {
    loadDashboard();
  }, [missionId]);

  const loadDashboard = async () => {
    if (!missionId) {
      setError('Mission ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.getStudentDashboard(missionId, studentId);
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.detail || '대시보드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: any, timeSpent: number) => {
    if (!missionId) return;

    try {
      const result = await apiService.submitAnswer(missionId, studentId, answer);

      // Reload dashboard to update streak and progress
      await loadDashboard();

      return result;
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          로딩 중...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/missions')} sx={{ mt: 2 }}>
          미션 목록으로 돌아가기
        </Button>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">대시보드 데이터가 없습니다.</Alert>
      </Container>
    );
  }

  const { mission, today_problem, progress, streak, date } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Mission Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {mission.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {mission.description}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          날짜: {new Date(date).toLocaleDateString('ko-KR')}
        </Typography>
      </Box>

      {/* Today's Problem */}
      {today_problem ? (
        <>
          {progress?.is_completed ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              오늘의 문제를 완료했습니다! {progress.is_correct ? '정답입니다! 🎉' : ''}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              오늘의 문제를 풀어보세요!
            </Alert>
          )}

          <DailyProblemCard
            problem={today_problem}
            missionId={missionId!}
            studentId={studentId}
            isCompleted={progress?.is_completed}
            isCorrect={progress?.is_correct}
            onSubmit={handleSubmitAnswer}
          />
        </>
      ) : (
        <Alert severity="warning">오늘의 문제가 아직 준비되지 않았습니다.</Alert>
      )}

      {/* Streak Display */}
      {streak && <StreakDisplay streak={streak} />}

      {/* Mission Info Card */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            미션 정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                과목
              </Typography>
              <Typography variant="body1">{mission.subject || '전체'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                학년
              </Typography>
              <Typography variant="body1">{mission.grade_level || '전체'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                시작일
              </Typography>
              <Typography variant="body1">
                {new Date(mission.start_date).toLocaleDateString('ko-KR')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                종료일
              </Typography>
              <Typography variant="body1">
                {mission.end_date
                  ? new Date(mission.end_date).toLocaleDateString('ko-KR')
                  : '진행 중'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentDashboard;
