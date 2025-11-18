import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  PlayArrow,
  EmojiEvents,
  Help,
} from '@mui/icons-material';
import { TimelineEvent } from '../../types/timeline';
import {
  formatDateTime,
  formatTime,
  formatDuration,
  getEventTypeName,
  getProblemTypeName,
  getDifficultyDisplay,
} from '../../utils/formatters';

interface TimelineListProps {
  events: TimelineEvent[];
}

const TimelineList: React.FC<TimelineListProps> = ({ events }) => {
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.event_type) {
      case 'module_start':
        return <PlayArrow />;
      case 'module_complete':
        return <EmojiEvents />;
      case 'attempt':
        return event.is_correct ? <CheckCircle /> : <Cancel />;
      default:
        return <PlayArrow />;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.event_type) {
      case 'module_start':
        return 'primary';
      case 'module_complete':
        return 'warning';
      case 'attempt':
        return event.is_correct ? 'success' : 'error';
      default:
        return 'grey';
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          🕐 학습 타임라인
        </Typography>

        <Timeline position="right">
          {events.map((event, index) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                <Typography variant="body2">{formatTime(event.timestamp)}</Typography>
                <Typography variant="caption">
                  {new Date(event.timestamp).toLocaleDateString('ko-KR')}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color={getEventColor(event)}>
                  {getEventIcon(event)}
                </TimelineDot>
                {index < events.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                  {/* Event Type Header */}
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={getEventTypeName(event.event_type)}
                      size="small"
                      color={getEventColor(event)}
                      sx={{ mr: 1 }}
                    />
                    {event.event_type === 'attempt' && event.hint_used && (
                      <Chip
                        icon={<Help />}
                        label="힌트 사용"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Module Events */}
                  {(event.event_type === 'module_start' || event.event_type === 'module_complete') && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {event.module_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.event_type === 'module_start' ? '모듈 학습 시작' : '모듈 학습 완료'}
                      </Typography>
                    </>
                  )}

                  {/* Attempt Events */}
                  {event.event_type === 'attempt' && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {event.problem_title}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {event.problem_type && (
                          <Chip
                            label={getProblemTypeName(event.problem_type)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {event.difficulty_level && (
                          <Chip
                            label={getDifficultyDisplay(event.difficulty_level)}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                        {event.module_name && (
                          <Chip
                            label={event.module_name}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          ⏱️ 풀이 시간: {formatDuration(event.time_spent_seconds || 0)}
                        </Typography>

                        {event.is_correct ? (
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                            ✓ 정답
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                            ✗ 오답
                          </Typography>
                        )}

                        {event.feedback && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              p: 1,
                              bgcolor: 'background.default',
                              borderRadius: 1,
                              fontStyle: 'italic',
                            }}
                          >
                            💬 {event.feedback}
                          </Typography>
                        )}
                      </Box>

                      {/* Show answer data for debugging/detail view */}
                      {event.answer_data && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            제출한 답: {JSON.stringify(event.answer_data)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>

        {events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              아직 학습 기록이 없습니다.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineList;
