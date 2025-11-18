/**
 * BreakNotification Component
 * Displays break recommendations to students with accept/defer/dismiss options
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Collapse,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  Fade,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Timer as TimerIcon,
  TipsAndUpdates as TipsIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface BreakActivity {
  type: string;
  name: string;
  description: string;
  instructions: string[];
  duration_minutes: number;
}

interface BreakRecommendation {
  recommendation_id: string;
  break_type: string;
  duration_minutes: number;
  urgency_level: 'low' | 'moderate' | 'high' | 'critical';
  activities: BreakActivity[];
  motivational_message: string;
  return_time: string;
  tips?: string[];
}

interface BreakNotificationProps {
  recommendation: BreakRecommendation;
  onAccept: (recommendationId: string) => void;
  onDefer: (recommendationId: string, deferMinutes: number) => void;
  onDismiss: (recommendationId: string) => void;
  autoHideDuration?: number; // milliseconds
}

const BreakNotification: React.FC<BreakNotificationProps> = ({
  recommendation,
  onAccept,
  onDefer,
  onDismiss,
  autoHideDuration = 60000, // 60 seconds default
}) => {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState(autoHideDuration / 1000);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    setOpen(false);
    onAccept(recommendation.recommendation_id);
  };

  const handleDefer = (minutes: number) => {
    setOpen(false);
    onDefer(recommendation.recommendation_id, minutes);
  };

  const handleDismiss = () => {
    setOpen(false);
    onDismiss(recommendation.recommendation_id);
  };

  const getUrgencyColor = () => {
    switch (recommendation.urgency_level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'success';
    }
  };

  const getUrgencyText = () => {
    switch (recommendation.urgency_level) {
      case 'critical':
        return 'Urgent Break Needed';
      case 'high':
        return 'Break Recommended';
      case 'moderate':
        return 'Time for a Break';
      default:
        return 'Break Suggestion';
    }
  };

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Card
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          maxWidth: 400,
          minWidth: 320,
          boxShadow: 6,
          zIndex: 1300,
          borderLeft: 4,
          borderColor: `${getUrgencyColor()}.main`,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={(countdown / (autoHideDuration / 1000)) * 100}
          color={getUrgencyColor()}
          sx={{ height: 2 }}
        />

        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Chip
                  label={getUrgencyText()}
                  color={getUrgencyColor()}
                  size="small"
                  icon={<TimerIcon />}
                />
                <Typography variant="caption" color="text.secondary">
                  Auto-dismiss in {countdown}s
                </Typography>
              </Stack>

              <Typography variant="h6" gutterBottom>
                {recommendation.motivational_message}
              </Typography>

              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  icon={<TimerIcon />}
                  label={`${recommendation.duration_minutes} min`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<TipsIcon />}
                  label={recommendation.break_type.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>

            <IconButton size="small" onClick={handleDismiss} sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Activities Preview */}
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Suggested Activities:
            </Typography>
            {recommendation.activities.slice(0, 2).map((activity, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                • {activity.name} ({activity.duration_minutes} min)
              </Typography>
            ))}
            {recommendation.activities.length > 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                +{recommendation.activities.length - 2} more...
              </Typography>
            )}
          </Box>

          {/* Expandable Details */}
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ mb: expanded ? 2 : 0 }}
          >
            {expanded ? 'Show Less' : 'Show Details'}
          </Button>

          <Collapse in={expanded}>
            {recommendation.tips && recommendation.tips.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tips:
                </Typography>
                {recommendation.tips.map((tip, index) => (
                  <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                    • {tip}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Detailed Activity Instructions */}
            {recommendation.activities.map((activity, index) => (
              <Box key={index} mb={2}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {activity.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  {activity.description}
                </Typography>
                <Box sx={{ ml: 2, mt: 1 }}>
                  {activity.instructions.map((instruction, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      {idx + 1}. {instruction}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ))}
          </Collapse>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color={getUrgencyColor()}
              fullWidth
              startIcon={<CheckIcon />}
              onClick={handleAccept}
            >
              Take Break Now
            </Button>
            <Button
              variant="outlined"
              color={getUrgencyColor()}
              onClick={() => handleDefer(5)}
              startIcon={<ScheduleIcon />}
            >
              5 min
            </Button>
            <Button
              variant="outlined"
              color={getUrgencyColor()}
              onClick={() => handleDefer(10)}
              startIcon={<ScheduleIcon />}
            >
              10 min
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Slide>
  );
};

export default BreakNotification;
