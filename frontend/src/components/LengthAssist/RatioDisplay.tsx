// Ratio Display Component

import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { RatioCalculation } from '@/types/geometry';

interface RatioDisplayProps {
  ratio: RatioCalculation | null;
  showDetails?: boolean;
}

const RatioDisplay: React.FC<RatioDisplayProps> = ({
  ratio,
  showDetails = true,
}) => {
  if (!ratio) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            두 개의 선분을 선택하여 비율을 계산하세요
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, backgroundColor: '#f5f5f5' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          비율 계산 결과
        </Typography>

        {/* Simplified Ratio */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" color="primary" sx={{ mr: 2 }}>
            {ratio.simplifiedRatio}
          </Typography>
          <Chip
            label={`${ratio.ratio.toFixed(2)}`}
            color="primary"
            size="small"
          />
        </Box>

        {/* Details */}
        {showDetails && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>선분 1 길이:</strong> {ratio.line1Length.toFixed(2)} px
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>선분 2 길이:</strong> {ratio.line2Length.toFixed(2)} px
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>백분율:</strong> {ratio.percentage?.toFixed(1)}%
            </Typography>
          </Box>
        )}

        {/* Visual Representation */}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: `${Math.min((ratio.line1Length / ratio.line2Length) * 100, 100)}%`,
                height: 20,
                backgroundColor: '#1976d2',
                borderRadius: 1,
                mr: 1,
              }}
            />
            <Typography variant="caption">선분 1</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: 20,
                backgroundColor: '#9c27b0',
                borderRadius: 1,
                mr: 1,
              }}
            />
            <Typography variant="caption">선분 2</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RatioDisplay;
