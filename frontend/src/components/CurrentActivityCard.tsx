/**
 * Current Activity Card Component
 * Displays what the student is currently doing
 */

import { Box, Typography, LinearProgress, Chip, Grid } from '@mui/material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import type { CurrentActivity } from '../../../shared/types';

interface CurrentActivityCardProps {
  activity: CurrentActivity;
}

export default function CurrentActivityCard({ activity }: CurrentActivityCardProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분 ${secs}초`;
  };

  const getActivityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      reading: '읽기',
      problem_solving: '문제 풀이',
      video_watching: '비디오 시청',
      interactive_exercise: '인터랙티브 연습',
      assessment: '평가',
      reflection: '성찰'
    };
    return labels[type] || type;
  };

  const getActivityTypeColor = (type: string): "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" => {
    const colors: Record<string, any> = {
      reading: 'info',
      problem_solving: 'primary',
      video_watching: 'secondary',
      interactive_exercise: 'success',
      assessment: 'warning',
      reflection: 'default'
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PlayArrowIcon sx={{ mr: 1, animation: 'pulse 2s infinite' }} />
            <Chip
              label={getActivityTypeLabel(activity.activityType)}
              color={getActivityTypeColor(activity.activityType)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="caption">
              {activity.moduleName}
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activity.activityName}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              ⏱️ 경과 시간: <strong>{formatDuration(activity.elapsedTime)}</strong>
            </Typography>
            <Typography variant="body2">
              🖱️ 상호작용: <strong>{activity.interactions}회</strong>
            </Typography>
            <Typography variant="body2">
              🕐 시작: {new Date(activity.startedAt).toLocaleTimeString('ko-KR')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="body2" gutterBottom>
            진행도: {activity.progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={activity.progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white'
              }
            }}
          />
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
}
