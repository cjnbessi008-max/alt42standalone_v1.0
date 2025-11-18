import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';

interface ScoreCardProps {
  title: string;
  score: number;
  color?: string;
  icon?: React.ReactNode;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  color = 'primary',
  icon,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const scoreColor = getScoreColor(score);

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && <Box sx={{ mr: 1, color: scoreColor }}>{icon}</Box>}
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ mb: 2, color: scoreColor, fontWeight: 'bold' }}>
          {score.toFixed(1)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: scoreColor,
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
          / 100
        </Typography>
      </CardContent>
    </Card>
  );
};
