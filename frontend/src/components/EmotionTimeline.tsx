import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { EmotionRecord } from '../types';
import { getEmotionConfig } from '../utils/emotionConfig';

interface EmotionTimelineProps {
  emotions: EmotionRecord[];
}

export const EmotionTimeline: React.FC<EmotionTimelineProps> = ({ emotions }) => {
  if (emotions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">아직 기록된 감정이 없습니다.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {emotions.map((emotion) => {
        const config = getEmotionConfig(emotion.emotion_type);

        return (
          <Card key={emotion.id} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {config.emoji}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{config.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(emotion.recorded_at), 'PPp', { locale: ko })}
                  </Typography>
                </Box>
                <Chip
                  label={`강도: ${emotion.intensity}/5`}
                  size="small"
                  sx={{
                    backgroundColor: config.color,
                    color: 'white',
                  }}
                />
              </Box>

              {emotion.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  💭 {emotion.note}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};
