/**
 * DMN Status Badge Component
 * Compact badge version for use in lists and tables
 */

import React from 'react';
import { Chip, Box } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { DMNStatus, DMN_COLORS, DMN_LABELS } from '../../types/dmn.types';

interface DMNStatusBadgeProps {
  status: DMNStatus;
  confidence?: number;
  language?: 'ko' | 'en';
  size?: 'small' | 'medium';
  showConfidence?: boolean;
}

export const DMNStatusBadge: React.FC<DMNStatusBadgeProps> = ({
  status,
  confidence,
  language = 'ko',
  size = 'small',
  showConfidence = true,
}) => {
  const color = DMN_COLORS[status];
  const label = DMN_LABELS[status][language];

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Chip
        icon={<CircleIcon sx={{ fill: color }} />}
        label={label}
        size={size}
        sx={{
          bgcolor: `${color}20`,
          color: color,
          fontWeight: 'bold',
          border: `1px solid ${color}`,
        }}
      />
      {showConfidence && confidence !== undefined && (
        <Chip
          label={`${Math.round(confidence * 100)}%`}
          size={size}
          variant="outlined"
          sx={{
            fontSize: '0.7rem',
            height: size === 'small' ? '20px' : '24px',
          }}
        />
      )}
    </Box>
  );
};
