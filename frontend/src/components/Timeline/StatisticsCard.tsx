import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Timer,
  EmojiEvents,
  Help,
} from '@mui/icons-material';
import { Statistics } from '../../types/timeline';
import { formatDuration, formatPercentage } from '../../utils/formatters';

interface StatisticsCardProps {
  statistics: Statistics;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ statistics }) => {
  const {
    total_attempts,
    correct_attempts,
    accuracy_rate,
    total_time_seconds,
    average_time_per_attempt,
    modules_completed,
    hints_used,
    hint_usage_rate,
  } = statistics;

  const incorrectAttempts = total_attempts - correct_attempts;

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          📊 학습 통계
        </Typography>

        <Grid container spacing={3}>
          {/* Total Attempts */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                총 시도 횟수
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                {total_attempts}
              </Typography>
              <Chip label="전체" size="small" />
            </Box>
          </Grid>

          {/* Correct Attempts */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                정답
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {correct_attempts}
              </Typography>
            </Box>
          </Grid>

          {/* Incorrect Attempts */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                오답
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {incorrectAttempts}
              </Typography>
            </Box>
          </Grid>

          {/* Accuracy Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                정답률
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {formatPercentage(accuracy_rate)}
              </Typography>
            </Box>
          </Grid>

          {/* Total Time */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Timer sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                총 학습 시간
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatDuration(total_time_seconds)}
              </Typography>
            </Box>
          </Grid>

          {/* Average Time */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Timer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                평균 풀이 시간
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatDuration(Math.round(average_time_per_attempt))}
              </Typography>
            </Box>
          </Grid>

          {/* Modules Completed */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                완료한 모듈
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                {modules_completed}
              </Typography>
              <Chip label="모듈" size="small" color="primary" />
            </Box>
          </Grid>

          {/* Hints Used */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Help sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                힌트 사용
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {hints_used}회 ({formatPercentage(hint_usage_rate)})
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
