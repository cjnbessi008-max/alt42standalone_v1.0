/**
 * Session Summary Component
 *
 * Shows summary and encouragement when session ends
 */

import React from 'react';
import { Box, Button, Paper, Typography, Divider } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { SessionSummary as SessionSummaryType } from '../types/motivationMode.types';

interface SessionSummaryProps {
  summary: SessionSummaryType;
  onClose: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  summary,
  onClose,
}) => {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0분';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}초`;
    if (remainingSeconds === 0) return `${minutes}분`;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 600,
          width: '100%',
          padding: 6,
          backgroundColor: '#ffffff',
          borderRadius: 3,
          border: '2px solid #6366f1',
          textAlign: 'center',
        }}
      >
        {/* Celebration Icon */}
        <Box sx={{ marginBottom: 3 }}>
          <TrophyIcon
            sx={{
              fontSize: 80,
              color: '#f59e0b',
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: 2,
          }}
        >
          🎉 오늘의 학습 완료!
        </Typography>

        {/* Closing Message */}
        <Typography
          variant="body1"
          sx={{
            fontSize: 18,
            color: '#495057',
            marginBottom: 4,
            lineHeight: 1.6,
          }}
        >
          {summary.closingMessage}
        </Typography>

        <Divider sx={{ marginY: 3 }} />

        {/* Statistics */}
        <Box sx={{ marginBottom: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 3,
              marginBottom: 3,
            }}
          >
            <StatCard
              icon={<CheckIcon sx={{ color: '#10b981' }} />}
              label="푼 문제"
              value={`${summary.problemsCompleted}개`}
            />
            <StatCard
              icon={<CheckIcon sx={{ color: '#10b981' }} />}
              label="정답"
              value={`${summary.problemsCorrect}개`}
            />
            <StatCard
              icon={<FireIcon sx={{ color: '#ef4444' }} />}
              label="최고 연속 정답"
              value={`${summary.maxStreak}개`}
            />
          </Box>

          {summary.durationSeconds !== undefined && (
            <Typography
              sx={{
                fontSize: 14,
                color: '#6c757d',
                marginTop: 2,
              }}
            >
              학습 시간: {formatDuration(summary.durationSeconds)}
            </Typography>
          )}
        </Box>

        {/* Achievement Highlights */}
        {summary.achievementHighlights.length > 0 && (
          <Box sx={{ marginBottom: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: 2,
              }}
            >
              오늘의 성과
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {summary.achievementHighlights.map((highlight, index) => (
                <Box
                  key={index}
                  sx={{
                    padding: 2,
                    backgroundColor: '#f0fdf4',
                    borderRadius: 2,
                    border: '1px solid #86efac',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 16,
                      color: '#166534',
                      fontWeight: 600,
                    }}
                  >
                    {highlight}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Close Button */}
        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          sx={{
            minWidth: 200,
            height: 48,
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: '#6366f1',
            '&:hover': {
              backgroundColor: '#4f46e5',
            },
          }}
        >
          확인
        </Button>
      </Paper>
    </Box>
  );
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ fontSize: 32 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 14,
          color: '#6c757d',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1f2937',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};
