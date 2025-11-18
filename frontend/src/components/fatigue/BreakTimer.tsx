/**
 * BreakTimer Component
 *
 * Timer shown during break with recovery progress visualization.
 * Displays elapsed time, remaining time, and completed activities.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  DirectionsWalk,
  LocalCafe,
  SelfImprovement,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface BreakTimerProps {
  durationMinutes: number;
  onComplete: (actualDuration: number, activities: string[]) => void;
  onCancel?: () => void;
  autoStart?: boolean;
}

const BreakTimer: React.FC<BreakTimerProps> = ({
  durationMinutes,
  onComplete,
  onCancel,
  autoStart = true
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [showActivities, setShowActivities] = useState(true);

  const totalSeconds = durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = (elapsedSeconds / totalSeconds) * 100;

  // Activity options
  const activityOptions = [
    { id: 'stretch', label: '스트레칭', icon: <SelfImprovement /> },
    { id: 'walk', label: '걷기', icon: <DirectionsWalk /> },
    { id: 'hydrate', label: '물 마시기', icon: <LocalCafe /> },
    { id: 'eyes', label: '눈 휴식', icon: <SelfImprovement /> }
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && elapsedSeconds < totalSeconds) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (elapsedSeconds >= totalSeconds) {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, elapsedSeconds, totalSeconds]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle activity
  const toggleActivity = (activityId: string) => {
    setCompletedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  // Handle completion
  const handleComplete = () => {
    const actualDurationMinutes = Math.ceil(elapsedSeconds / 60);
    onComplete(actualDurationMinutes, completedActivities);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsRunning(false);
    if (onCancel) onCancel();
  };

  // Calculate recovery percentage (based on elapsed time)
  const recoveryPercentage = Math.min(100, progress);

  return (
    <Card
      sx={{
        maxWidth: 400,
        margin: 'auto',
        boxShadow: 3,
        borderRadius: 2
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            휴식 타이머
          </Typography>
          <Chip
            label={`${durationMinutes}분 휴식`}
            color="primary"
            size="small"
          />
        </Box>

        {/* Timer display */}
        <Box textAlign="center" my={3}>
          <Typography variant="h2" component="div" fontWeight="bold" color="primary">
            {formatTime(remainingSeconds)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            경과 시간: {formatTime(elapsedSeconds)}
          </Typography>
        </Box>

        {/* Progress bar */}
        <Box mb={3}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: progress >= 100 ? 'success.main' : 'primary.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            회복률: {recoveryPercentage.toFixed(0)}%
          </Typography>
        </Box>

        {/* Timer controls */}
        <Box display="flex" justifyContent="center" gap={1} mb={2}>
          <IconButton
            color="primary"
            onClick={() => setIsRunning(!isRunning)}
            disabled={elapsedSeconds >= totalSeconds}
          >
            {isRunning ? <Pause /> : <PlayArrow />}
          </IconButton>

          <IconButton
            color="error"
            onClick={handleCancel}
          >
            <Stop />
          </IconButton>
        </Box>

        {/* Activities section */}
        <Box>
          <Button
            fullWidth
            variant="text"
            onClick={() => setShowActivities(!showActivities)}
            endIcon={showActivities ? <ExpandLess /> : <ExpandMore />}
            sx={{ mb: 1 }}
          >
            활동 체크리스트
          </Button>

          <Collapse in={showActivities}>
            <Stack spacing={1}>
              {activityOptions.map((activity) => (
                <Button
                  key={activity.id}
                  variant={completedActivities.includes(activity.id) ? 'contained' : 'outlined'}
                  color={completedActivities.includes(activity.id) ? 'success' : 'inherit'}
                  startIcon={activity.icon}
                  endIcon={completedActivities.includes(activity.id) ? <CheckCircle /> : null}
                  onClick={() => toggleActivity(activity.id)}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {activity.label}
                </Button>
              ))}
            </Stack>
          </Collapse>
        </Box>

        {/* Complete button */}
        {elapsedSeconds >= totalSeconds && (
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            startIcon={<CheckCircle />}
            onClick={handleComplete}
            sx={{ mt: 2 }}
          >
            휴식 완료!
          </Button>
        )}

        {/* Early completion option */}
        {elapsedSeconds < totalSeconds && elapsedSeconds > 60 && (
          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={handleComplete}
            sx={{ mt: 2 }}
          >
            지금 완료하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BreakTimer;
