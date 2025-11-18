import React, { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import { Condition, ConditionType } from '@/types';
import { colorScheme, conditionTypeLabels, conditionTypeIcons } from '@/config/colorScheme';

interface ConditionHighlighterProps {
  condition: Condition;
  onClick?: (condition: Condition) => void;
}

/**
 * ConditionHighlighter - Displays a single condition with color-coded highlighting
 */
export const ConditionHighlighter: React.FC<ConditionHighlighterProps> = ({
  condition,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorScheme[condition.type];

  const handleClick = () => {
    if (onClick) {
      onClick(condition);
    }
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
            {conditionTypeIcons[condition.type]} {conditionTypeLabels[condition.type]}
          </Typography>
          {condition.description && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              {condition.description}
            </Typography>
          )}
        </Box>
      }
      arrow
      placement="top"
    >
      <Paper
        elevation={isHovered ? 4 : 1}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        sx={{
          display: 'inline-block',
          padding: '8px 16px',
          margin: '4px',
          backgroundColor: isHovered ? colors.hover : colors.background,
          borderLeft: `4px solid ${colors.border}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: onClick ? 'translateY(-2px)' : 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: colors.primary,
              fontWeight: 500,
            }}
          >
            {conditionTypeIcons[condition.type]}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              fontWeight: 500,
            }}
          >
            {condition.text}
          </Typography>
          <Chip
            label={conditionTypeLabels[condition.type]}
            size="small"
            sx={{
              backgroundColor: colors.primary,
              color: 'white',
              fontSize: '0.7rem',
              height: '20px',
            }}
          />
        </Box>
      </Paper>
    </Tooltip>
  );
};

export default ConditionHighlighter;
