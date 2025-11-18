/**
 * Motivation Mode Header Component
 *
 * Simple header showing mode status and exit option
 */

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Close as CloseIcon, AutoAwesome as SparkleIcon } from '@mui/icons-material';

interface MotivationModeHeaderProps {
  onExit: () => void;
  showStreak?: boolean;
  currentStreak?: number;
}

export const MotivationModeHeader: React.FC<MotivationModeHeaderProps> = ({
  onExit,
  showStreak = true,
  currentStreak = 0,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 2,
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SparkleIcon sx={{ color: '#6366f1', fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: '#495057', fontWeight: 500 }}>
          한 문제씩 천천히
        </Typography>
      </Box>

      {showStreak && currentStreak > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            padding: '4px 12px',
            backgroundColor: '#fff3cd',
            borderRadius: 16,
          }}
        >
          <Typography sx={{ fontSize: 18 }}>🔥</Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: '#856404',
            }}
          >
            연속 {currentStreak}문제!
          </Typography>
        </Box>
      )}

      <Tooltip title="나가기">
        <IconButton
          onClick={onExit}
          sx={{
            color: '#6c757d',
            '&:hover': {
              backgroundColor: '#e9ecef',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
