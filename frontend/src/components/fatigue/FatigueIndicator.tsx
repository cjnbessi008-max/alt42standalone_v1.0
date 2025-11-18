/**
 * FatigueIndicator Component
 *
 * Visual indicator showing current fatigue level with circular progress bar.
 * Changes color from green -> yellow -> orange -> red based on fatigue score.
 */

import React from 'react';
import { Box, CircularProgress, Tooltip, Typography, useTheme } from '@mui/material';
import { Favorite, FavoriteBorder, LocalCafe, SelfImprovement } from '@mui/icons-material';

interface FatigueIndicatorProps {
  fatigueScore: number; // 0-100
  fatigueLevel: number; // 1-5
  trend: 'increasing' | 'stable' | 'decreasing';
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const FatigueIndicator: React.FC<FatigueIndicatorProps> = ({
  fatigueScore,
  fatigueLevel,
  trend,
  showDetails = true,
  size = 'medium'
}) => {
  const theme = useTheme();

  // Size configurations
  const sizeConfig = {
    small: { dimension: 60, iconSize: 24, fontSize: '0.75rem' },
    medium: { dimension: 100, iconSize: 40, fontSize: '1rem' },
    large: { dimension: 150, iconSize: 60, fontSize: '1.5rem' }
  };

  const config = sizeConfig[size];

  // Color configuration based on fatigue level
  const getColor = () => {
    if (fatigueLevel === 1) return theme.palette.success.main; // Green
    if (fatigueLevel === 2) return theme.palette.info.main; // Blue
    if (fatigueLevel === 3) return theme.palette.warning.light; // Yellow
    if (fatigueLevel === 4) return theme.palette.warning.dark; // Orange
    return theme.palette.error.main; // Red
  };

  // Get fatigue level label
  const getLevelLabel = () => {
    const labels = {
      1: '최상 (Fresh)',
      2: '양호 (Mild)',
      3: '주의 (Moderate)',
      4: '피로 (High)',
      5: '위험 (Exhaustion)'
    };
    return labels[fatigueLevel as keyof typeof labels] || 'Unknown';
  };

  // Get trend icon and label
  const getTrendInfo = () => {
    if (trend === 'increasing') return { label: '증가 중 ↑', color: theme.palette.error.light };
    if (trend === 'decreasing') return { label: '감소 중 ↓', color: theme.palette.success.light };
    return { label: '안정 →', color: theme.palette.grey[500] };
  };

  // Icon based on level
  const getIcon = () => {
    if (fatigueLevel <= 2) return <Favorite sx={{ fontSize: config.iconSize, color: getColor() }} />;
    if (fatigueLevel === 3) return <LocalCafe sx={{ fontSize: config.iconSize, color: getColor() }} />;
    return <SelfImprovement sx={{ fontSize: config.iconSize, color: getColor() }} />;
  };

  const trendInfo = getTrendInfo();

  // Tooltip content
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" fontWeight="bold">
        피로도 상세 정보
      </Typography>
      <Typography variant="caption" display="block">
        점수: {fatigueScore.toFixed(1)}/100
      </Typography>
      <Typography variant="caption" display="block">
        레벨: {getLevelLabel()}
      </Typography>
      <Typography variant="caption" display="block" color={trendInfo.color}>
        추세: {trendInfo.label}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={showDetails ? tooltipContent : ''} arrow placement="top">
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: config.dimension,
          height: config.dimension
        }}
      >
        {/* Background circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={config.dimension}
          thickness={4}
          sx={{
            position: 'absolute',
            color: theme.palette.grey[200]
          }}
        />

        {/* Fatigue progress circle */}
        <CircularProgress
          variant="determinate"
          value={fatigueScore}
          size={config.dimension}
          thickness={4}
          sx={{
            position: 'absolute',
            color: getColor(),
            // Pulse animation for high fatigue
            ...(fatigueLevel >= 4 && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 }
              }
            })
          }}
        />

        {/* Center content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute'
          }}
        >
          {getIcon()}

          {showDetails && (
            <Typography
              variant="caption"
              sx={{
                fontSize: config.fontSize,
                fontWeight: 'bold',
                color: getColor(),
                mt: 0.5
              }}
            >
              {fatigueScore.toFixed(0)}
            </Typography>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default FatigueIndicator;
