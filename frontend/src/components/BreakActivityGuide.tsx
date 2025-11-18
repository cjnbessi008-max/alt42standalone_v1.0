/**
 * BreakActivityGuide Component
 * Interactive guide for students during their break
 * Shows countdown, activity instructions, and completion tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipIcon,
  CheckCircle as CompleteIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface BreakActivity {
  type: string;
  name: string;
  description: string;
  instructions: string[];
  duration_minutes: number;
}

interface BreakActivityGuideProps {
  activities: BreakActivity[];
  totalDurationMinutes: number;
  recommendationId: string;
  onComplete: (data: {
    recommendationId: string;
    actualDurationMinutes: number;
    effectivenessRating: number;
    feedback?: string;
  }) => void;
  onCancel: () => void;
}

const BreakActivityGuide: React.FC<BreakActivityGuideProps> = ({
  activities,
  totalDurationMinutes,
  recommendationId,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(totalDurationMinutes * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [effectivenessRating, setEffectivenessRating] = useState<number>(4);
  const [feedback, setFeedback] = useState('');

  // Timer countdown
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleBreakComplete();
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (activeStep < activities.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      handleBreakComplete();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBreakComplete = () => {
    setShowCompletionDialog(true);
  };

  const handleSubmitCompletion = () => {
    const actualDuration = Math.ceil(elapsedTime / 60);
    onComplete({
      recommendationId,
      actualDurationMinutes: actualDuration,
      effectivenessRating,
      feedback: feedback.trim() || undefined,
    });
  };

  const progressPercentage = ((totalDurationMinutes * 60 - timeRemaining) / (totalDurationMinutes * 60)) * 100;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        zIndex: 1400,
        overflow: 'auto',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom align="center">
              Break Time
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
              Take this time to refresh and recharge
            </Typography>

            {/* Timer Display */}
            <Box sx={{ textAlign: 'center', my: 3 }}>
              <Typography variant="h2" color="primary" gutterBottom>
                {formatTime(timeRemaining)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {Math.round(progressPercentage)}% complete
              </Typography>
            </Box>

            {/* Pause/Resume Button */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <IconButton
                size="large"
                color="primary"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <PlayIcon fontSize="large" /> : <PauseIcon fontSize="large" />}
              </IconButton>
              <Typography variant="caption" display="block">
                {isPaused ? 'Resume' : 'Pause'}
              </Typography>
            </Box>
          </Box>

          {/* Activity Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {activities.map((activity, index) => (
              <Step key={index}>
                <StepLabel
                  optional={
                    <Chip
                      label={`${activity.duration_minutes} min`}
                      size="small"
                      icon={<TimerIcon />}
                    />
                  }
                >
                  <Typography variant="h6">{activity.name}</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {activity.description}
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Instructions:
                    </Typography>
                    {activity.instructions.map((instruction, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                        {idx + 1}. {instruction}
                      </Typography>
                    ))}
                  </Alert>

                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        startIcon={index === activities.length - 1 ? <CompleteIcon /> : <SkipIcon />}
                      >
                        {index === activities.length - 1 ? 'Complete Break' : 'Next Activity'}
                      </Button>
                      {index > 0 && (
                        <Button onClick={handleBack}>
                          Back
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Quick Actions */}
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={handleBreakComplete}
                startIcon={<CompleteIcon />}
              >
                End Break Early
              </Button>
              <Button
                variant="text"
                onClick={onCancel}
              >
                Cancel Break
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          How do you feel?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              You took a {Math.ceil(elapsedTime / 60)} minute break.
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              How effective was this break?
            </Typography>
            <Rating
              value={effectivenessRating}
              onChange={(_, value) => setEffectivenessRating(value || 0)}
              size="large"
              sx={{ mb: 3 }}
            />

            <TextField
              label="Feedback (optional)"
              placeholder="How did this break help you? Any suggestions?"
              multiline
              rows={3}
              fullWidth
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              variant="outlined"
            />

            <Alert severity="success" sx={{ mt: 2 }}>
              Great job taking a break! You're now ready to continue learning with renewed focus.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmitCompletion} variant="contained" size="large">
            Continue Learning
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BreakActivityGuide;
