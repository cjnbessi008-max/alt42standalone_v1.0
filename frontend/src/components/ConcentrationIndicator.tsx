/**
 * ConcentrationIndicator Component
 *
 * Displays student's current concentration level with visual feedback
 */

import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Psychology as BrainIcon,
  TrendingUp,
  TrendingDown,
  Remove as StableIcon
} from '@mui/icons-material';

interface ConcentrationIndicatorProps {
  score: number; // 0.0 to 1.0
  timeEfficiencyScore?: number;
  successRateScore?: number;
  engagementScore?: number;
  focusScore?: number;
  showDetails?: boolean;
}

export const ConcentrationIndicator: React.FC<ConcentrationIndicatorProps> = ({
  score,
  timeEfficiencyScore,
  successRateScore,
  engagementScore,
  focusScore,
  showDetails = false
}) => {
  // Determine color based on score
  const getColor = (value: number): string => {
    if (value >= 0.70) return '#4caf50'; // Green - Good
    if (value >= 0.50) return '#ff9800'; // Orange - Moderate
    if (value >= 0.30) return '#f44336'; // Red - Low
    return '#d32f2f'; // Dark red - Very low
  };

  // Get status text
  const getStatus = (value: number): { text: string; icon: React.ReactNode } => {
    if (value >= 0.70) {
      return {
        text: '집중도 우수',
        icon: <TrendingUp sx={{ color: '#4caf50' }} />
      };
    }
    if (value >= 0.50) {
      return {
        text: '집중도 보통',
        icon: <StableIcon sx={{ color: '#ff9800' }} />
      };
    }
    return {
      text: '집중력 저하',
      icon: <TrendingDown sx={{ color: '#f44336' }} />
    };
  };

  const status = getStatus(score);
  const color = getColor(score);
  const percentage = Math.round(score * 100);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <BrainIcon />
        <Typography variant="h6" fontWeight="bold">
          집중도 모니터
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        {status.icon}
        <Typography variant="body1" fontWeight="500">
          {status.text}
        </Typography>
        <Typography variant="h5" fontWeight="bold" ml="auto">
          {percentage}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.3)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 5
          }
        }}
      />

      {showDetails && (
        <Box mt={2} display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          <DetailItem
            label="시간 효율"
            value={timeEfficiencyScore}
            color={getColor(timeEfficiencyScore || 0)}
          />
          <DetailItem
            label="정답률"
            value={successRateScore}
            color={getColor(successRateScore || 0)}
          />
          <DetailItem
            label="참여도"
            value={engagementScore}
            color={getColor(engagementScore || 0)}
          />
          <DetailItem
            label="집중 유지"
            value={focusScore}
            color={getColor(focusScore || 0)}
          />
        </Box>
      )}

      <Typography variant="caption" display="block" mt={2} sx={{ opacity: 0.8 }}>
        집중력이 떨어지면 자동으로 쉬운 문제를 추천해드립니다
      </Typography>
    </Paper>
  );
};

interface DetailItemProps {
  label: string;
  value?: number;
  color: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, color }) => {
  const percentage = Math.round((value || 0) * 100);

  return (
    <Tooltip title={`${label}: ${percentage}%`}>
      <Box>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 3
              }
            }}
          />
          <Typography variant="caption" fontWeight="bold">
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default ConcentrationIndicator;
