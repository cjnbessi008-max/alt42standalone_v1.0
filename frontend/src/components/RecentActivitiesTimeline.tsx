/**
 * Recent Activities Timeline Component
 */

import { Card, CardContent, Typography, Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Box, Chip } from '@mui/material';
import type { ActivitySummary } from '../../../shared/types';

interface RecentActivitiesTimelineProps {
  activities: ActivitySummary[];
}

export default function RecentActivitiesTimeline({ activities }: RecentActivitiesTimelineProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return `${seconds}초`;
    return `${minutes}분`;
  };

  const getActivityColor = (outcome: string): "grey" | "primary" | "secondary" | "success" | "error" | "info" | "warning" | "inherit" => {
    const colors: Record<string, any> = {
      completed: 'success',
      abandoned: 'warning',
      in_progress: 'info'
    };
    return colors[outcome] || 'grey';
  };

  const getActivityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      reading: '📖 읽기',
      problem_solving: '🧮 문제 풀이',
      video_watching: '🎥 비디오',
      interactive_exercise: '🎯 연습',
      assessment: '📝 평가',
      reflection: '💭 성찰'
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          최근 활동
        </Typography>

        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              최근 활동이 없습니다
            </Typography>
          </Box>
        ) : (
          <Timeline position="right">
            {activities.map((activity, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                  <Typography variant="caption">
                    {new Date(activity.completedAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getActivityColor(activity.outcome)} />
                  {index < activities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {getActivityTypeLabel(activity.activityType)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.activityName}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={formatDuration(activity.duration)}
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
