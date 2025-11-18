import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import type { DailyEmotionSummary } from '../types';
import { getEmotionConfig } from '../utils/emotionConfig';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DailySummaryCardProps {
  summary: DailyEmotionSummary;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ summary }) => {
  const dominantConfig = getEmotionConfig(summary.dominant_emotion);

  const getTrendIcon = () => {
    switch (summary.emotion_trend) {
      case 'improving':
        return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'declining':
        return <TrendingDown sx={{ color: '#f44336' }} />;
      default:
        return <TrendingFlat sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getTrendLabel = () => {
    switch (summary.emotion_trend) {
      case 'improving':
        return '개선 중';
      case 'declining':
        return '주의 필요';
      default:
        return '안정적';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {format(new Date(summary.summary_date), 'PPP', { locale: ko })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTrendIcon()}
            <Typography variant="caption">{getTrendLabel()}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ mr: 2 }}>
            {dominantConfig.emoji}
          </Typography>
          <Box>
            <Typography variant="subtitle1">주된 감정: {dominantConfig.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              평균 강도: {summary.average_intensity.toFixed(1)}/5
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            감정 분포
          </Typography>
          {Object.entries(summary.emotion_distribution).map(([emotion, count]) => {
            if (count === 0) return null;
            const config = getEmotionConfig(emotion as any);
            const total = Object.values(summary.emotion_distribution).reduce(
              (a, b) => a + b,
              0
            );
            const percentage = (count / total) * 100;

            return (
              <Box key={emotion} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">
                    {config.emoji} {config.label}
                  </Typography>
                  <Typography variant="caption">{count}회</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    backgroundColor: '#f5f5f5',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: config.color,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${summary.session_count}개 세션`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${Math.round(summary.total_learning_minutes)}분 학습`}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};
