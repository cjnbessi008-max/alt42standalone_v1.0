/**
 * Feedback Display Component
 *
 * Shows feedback after answer submission with encouragement
 */

import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Fade,
  Grow,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
} from '@mui/icons-material';
import { FeedbackResponse } from '../types/motivationMode.types';
import { CelebrationAnimation } from './CelebrationAnimation';

interface FeedbackDisplayProps {
  feedback: FeedbackResponse;
  onContinue: () => void;
  onExit: () => void;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  onContinue,
  onExit,
}) => {
  const { isCorrect, encouragementMessage, celebration } = feedback;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 4,
        position: 'relative',
      }}
    >
      {/* Celebration Animation */}
      {celebration && <CelebrationAnimation celebration={celebration} />}

      <Fade in={true} timeout={500}>
        <Paper
          elevation={0}
          sx={{
            maxWidth: 600,
            width: '100%',
            padding: 6,
            backgroundColor: '#ffffff',
            borderRadius: 3,
            border: `2px solid ${isCorrect ? '#10b981' : '#f59e0b'}`,
            textAlign: 'center',
          }}
        >
          {/* Result Icon */}
          <Grow in={true} timeout={300}>
            <Box sx={{ marginBottom: 3 }}>
              {isCorrect ? (
                <CheckIcon
                  sx={{
                    fontSize: 80,
                    color: '#10b981',
                  }}
                />
              ) : (
                <WrongIcon
                  sx={{
                    fontSize: 80,
                    color: '#f59e0b',
                  }}
                />
              )}
            </Box>
          </Grow>

          {/* Feedback Message */}
          <Typography
            variant="h4"
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: isCorrect ? '#10b981' : '#f59e0b',
              marginBottom: 2,
            }}
          >
            {isCorrect ? '정답이에요!' : '아쉬워요!'}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: 18,
              color: '#495057',
              marginBottom: 3,
              lineHeight: 1.6,
            }}
          >
            {feedback.feedback}
          </Typography>

          {/* Encouragement Message */}
          {encouragementMessage && (
            <Box
              sx={{
                padding: 2,
                backgroundColor: '#fff3cd',
                borderRadius: 2,
                marginBottom: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  color: '#856404',
                  fontWeight: 600,
                }}
              >
                {encouragementMessage}
              </Typography>
            </Box>
          )}

          {/* Continuation Prompt */}
          <Box sx={{ marginTop: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 20,
                marginBottom: 3,
                color: '#1f2937',
              }}
            >
              {feedback.nextActionPrompt.message}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {feedback.nextActionPrompt.options.map((option) => (
                <Button
                  key={option.action}
                  variant={option.action === 'continue' ? 'contained' : 'outlined'}
                  size="large"
                  onClick={option.action === 'continue' ? onContinue : onExit}
                  sx={{
                    minWidth: 160,
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    ...(option.action === 'continue'
                      ? {
                          backgroundColor: '#6366f1',
                          '&:hover': {
                            backgroundColor: '#4f46e5',
                          },
                        }
                      : {
                          borderColor: '#6c757d',
                          color: '#6c757d',
                          '&:hover': {
                            borderColor: '#495057',
                            color: '#495057',
                            backgroundColor: '#f8f9fa',
                          },
                        }),
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};
