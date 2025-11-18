/**
 * DMN Status Indicator Component
 * Main visual indicator showing real-time DMN activation status
 */

import React from 'react';
import { Box, Paper, Typography, Tooltip } from '@mui/material';
import { DMNStatus, DMN_COLORS, DMN_LABELS, DMNStatusData } from '../../types/dmn.types';

interface DMNStatusIndicatorProps {
  status: DMNStatusData | null;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  language?: 'ko' | 'en';
}

const SIZES = {
  small: { width: 60, height: 60, fontSize: '0.75rem' },
  medium: { width: 100, height: 100, fontSize: '0.875rem' },
  large: { width: 150, height: 150, fontSize: '1rem' },
};

export const DMNStatusIndicator: React.FC<DMNStatusIndicatorProps> = ({
  status,
  size = 'medium',
  showDetails = true,
  language = 'ko',
}) => {
  if (!status) {
    return (
      <Paper
        sx={{
          ...SIZES[size],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#E0E0E0',
          borderRadius: '50%',
          transition: 'all 0.3s ease',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {language === 'ko' ? '대기 중' : 'Waiting'}
        </Typography>
      </Paper>
    );
  }

  const color = status.color_code || DMN_COLORS[status.status];
  const label = DMN_LABELS[status.status][language];
  const confidence = Math.round(status.confidence_score * 100);

  const indicator = (
    <Paper
      elevation={3}
      sx={{
        ...SIZES[size],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: color,
        borderRadius: '50%',
        transition: 'all 0.5s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
          bgcolor: 'rgba(255, 255, 255, 0.3)',
        },
        '@keyframes pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: 1,
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: 0.7,
          },
        },
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: `0 0 20px ${color}`,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: SIZES[size].fontSize,
          textAlign: 'center',
          zIndex: 1,
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: `calc(${SIZES[size].fontSize} * 0.8)`,
          zIndex: 1,
        }}
      >
        {confidence}%
      </Typography>
    </Paper>
  );

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="caption" display="block">
        {language === 'ko' ? '신뢰도' : 'Confidence'}: {confidence}%
      </Typography>
      {status.metadata?.engagement_score && (
        <Typography variant="caption" display="block">
          {language === 'ko' ? '참여도' : 'Engagement'}: {Math.round(status.metadata.engagement_score * 100)}%
        </Typography>
      )}
      <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
        {new Date(status.recorded_at).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US')}
      </Typography>
    </Box>
  );

  if (showDetails) {
    return (
      <Tooltip title={tooltipContent} arrow placement="right">
        {indicator}
      </Tooltip>
    );
  }

  return indicator;
};
