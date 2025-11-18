/**
 * Streak Display Component
 * Shows student's current streak and statistics
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  LocalFireDepartment,
  EmojiEvents,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  total_correct: number;
  last_completed_date?: string;
}

interface StreakDisplayProps {
  streak: StreakData;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak }) => {
  const accuracyRate =
    streak.total_completed > 0
      ? Math.round((streak.total_correct / streak.total_completed) * 100)
      : 0;

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          학습 현황
        </Typography>

        <Grid container spacing={3}>
          {/* Current Streak */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <LocalFireDepartment
                sx={{
                  fontSize: 48,
                  color: streak.current_streak > 0 ? 'error.main' : 'grey.400',
                }}
              />
              <Typography variant="h4" fontWeight="bold">
                {streak.current_streak}일
              </Typography>
              <Typography variant="body2" color="text.secondary">
                현재 연속
              </Typography>
            </Box>
          </Grid>

          {/* Longest Streak */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <EmojiEvents sx={{ fontSize: 48, color: 'warning.main' }} />
              <Typography variant="h4" fontWeight="bold">
                {streak.longest_streak}일
              </Typography>
              <Typography variant="body2" color="text.secondary">
                최장 연속
              </Typography>
            </Box>
          </Grid>

          {/* Total Completed */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              <Typography variant="h4" fontWeight="bold">
                {streak.total_completed}개
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완료한 문제
              </Typography>
            </Box>
          </Grid>

          {/* Accuracy Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <TrendingUp sx={{ fontSize: 48, color: 'info.main' }} />
              <Typography variant="h4" fontWeight="bold">
                {accuracyRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                정답률
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Accuracy Progress Bar */}
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">정답 진행률</Typography>
            <Typography variant="body2" color="text.secondary">
              {streak.total_correct} / {streak.total_completed}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={accuracyRate}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* Motivational Message */}
        <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
          <Typography variant="body2" color="primary.contrastText" textAlign="center">
            {streak.current_streak === 0 && '오늘의 문제를 풀고 연속 기록을 시작하세요! 🚀'}
            {streak.current_streak > 0 &&
              streak.current_streak < 7 &&
              `${streak.current_streak}일 연속 달성! 계속 이어가세요! 💪`}
            {streak.current_streak >= 7 &&
              streak.current_streak < 30 &&
              `대단해요! ${streak.current_streak}일 연속 학습 중! 🔥`}
            {streak.current_streak >= 30 &&
              `놀라워요! ${streak.current_streak}일 연속 학습! 당신은 챔피언입니다! 🏆`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StreakDisplay;
