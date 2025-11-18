import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material';

const MobileRoadmapPreview = ({ roadmapData, progressData }) => {
  if (!roadmapData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          로딩중...
        </Typography>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Progress Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            전체 진행률
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressData?.progress_percentage || 0}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" fontWeight="bold">
              {progressData?.progress_percentage || 0}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stage Cards */}
      {roadmapData.stages.map((stage, index) => (
        <Card key={index} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight="bold">
                {stage.displayName}
              </Typography>
              <Chip
                label={
                  stage.status === 'completed'
                    ? '완료'
                    : stage.status === 'in_progress'
                    ? '진행중'
                    : stage.status === 'failed'
                    ? '실패'
                    : '대기'
                }
                color={getStatusColor(stage.status)}
                size="small"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
            {stage.durationSeconds && (
              <Typography variant="caption" color="text.secondary">
                소요시간: {Math.round(stage.durationSeconds)}초
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default MobileRoadmapPreview;
