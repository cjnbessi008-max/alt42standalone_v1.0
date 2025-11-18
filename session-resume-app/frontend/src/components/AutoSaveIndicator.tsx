/**
 * AutoSaveIndicator Component - Show auto-save status
 */

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Cloud, CloudOff } from '@mui/icons-material';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  error,
}) => {
  const getContent = () => {
    if (error) {
      return {
        icon: <CloudOff fontSize="small" color="error" />,
        text: '저장 실패',
        color: 'error.main',
      };
    }

    if (isSaving) {
      return {
        icon: <CircularProgress size={16} />,
        text: '저장 중...',
        color: 'text.secondary',
      };
    }

    if (lastSaved) {
      const timeAgo = getTimeAgo(lastSaved);
      return {
        icon: <CheckCircle fontSize="small" color="success" />,
        text: `${timeAgo} 저장됨`,
        color: 'success.main',
      };
    }

    return {
      icon: <Cloud fontSize="small" color="disabled" />,
      text: '대기 중',
      color: 'text.disabled',
    };
  };

  const { icon, text, color } = getContent();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: '0.875rem',
      }}
    >
      {icon}
      <Typography variant="caption" color={color}>
        {text}
      </Typography>
    </Box>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}초 전`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}
