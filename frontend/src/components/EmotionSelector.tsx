import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  Typography,
  Slider,
  Paper,
  Alert,
} from '@mui/material';
import { emotionOptions } from '../utils/emotionConfig';
import { emotionApi } from '../services/api';
import type { EmotionType } from '../types';

interface EmotionSelectorProps {
  studentId: string;
  sessionId?: string;
  onEmotionRecorded?: () => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  studentId,
  sessionId,
  onEmotionRecorded,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEmotion) return;

    setIsSubmitting(true);
    try {
      await emotionApi.create({
        student_id: studentId,
        session_id: sessionId,
        emotion_type: selectedEmotion,
        intensity,
        note: note || undefined,
      });

      setSuccess(true);
      setSelectedEmotion(null);
      setIntensity(3);
      setNote('');

      setTimeout(() => setSuccess(false), 3000);

      if (onEmotionRecorded) {
        onEmotionRecorded();
      }
    } catch (error) {
      console.error('Failed to record emotion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        지금 기분이 어때요?
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          감정이 기록되었습니다!
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {emotionOptions.map((option) => (
            <Button
              key={option.type}
              onClick={() => setSelectedEmotion(option.type)}
              variant={selectedEmotion === option.type ? 'contained' : 'outlined'}
              sx={{
                flexDirection: 'column',
                p: 2,
                minWidth: 100,
                borderColor: option.color,
                color: selectedEmotion === option.type ? 'white' : option.color,
                backgroundColor:
                  selectedEmotion === option.type ? option.color : 'transparent',
                '&:hover': {
                  backgroundColor:
                    selectedEmotion === option.type ? option.color : `${option.color}20`,
                  borderColor: option.color,
                },
              }}
            >
              <Typography variant="h4">{option.emoji}</Typography>
              <Typography variant="caption">{option.label}</Typography>
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {selectedEmotion && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>얼마나 강하게 느끼나요?</Typography>
            <Slider
              value={intensity}
              onChange={(_, value) => setIntensity(value as number)}
              min={1}
              max={5}
              marks
              step={1}
              valueLabelDisplay="auto"
              sx={{
                color: emotionOptions.find((e) => e.type === selectedEmotion)?.color,
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">약함</Typography>
              <Typography variant="caption">강함</Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="추가 메모 (선택사항)"
            placeholder="무엇 때문에 그런 기분이 드나요?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              backgroundColor: emotionOptions.find((e) => e.type === selectedEmotion)?.color,
              '&:hover': {
                backgroundColor: emotionOptions.find((e) => e.type === selectedEmotion)?.color,
                opacity: 0.9,
              },
            }}
          >
            {isSubmitting ? '기록 중...' : '감정 기록하기'}
          </Button>
        </>
      )}
    </Paper>
  );
};
