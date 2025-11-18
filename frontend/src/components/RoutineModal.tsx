import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Rating,
  TextField,
  IconButton,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setShowRoutineModal, completeCurrentRoutine, setCurrentRoutine } from '../store/slices/routineSlice';
import { routineAPI } from '../services/api';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RoutineModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showRoutineModal, currentRoutine } = useSelector((state: RootState) => state.routine);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (showRoutineModal && currentRoutine) {
      setCurrentStep(0);
      setIsCompleted(false);
      setRating(0);
      setFeedback('');
      setStartTime(Date.now());

      // Initialize timer for first step
      const routine = currentRoutine.routineType;
      if (routine.content.steps && routine.content.steps.length > 0) {
        setTimeLeft(routine.content.steps[0].duration);
      } else if (routine.content.messages) {
        setTimeLeft(routine.duration);
      }
    }
  }, [showRoutineModal, currentRoutine]);

  useEffect(() => {
    if (!showRoutineModal || !currentRoutine || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next step
          const routine = currentRoutine.routineType;
          if (routine.content.steps) {
            const nextStep = currentStep + 1;
            if (nextStep < routine.content.steps.length) {
              setCurrentStep(nextStep);
              return routine.content.steps[nextStep].duration;
            } else {
              // All steps completed
              setIsCompleted(true);
              return 0;
            }
          } else {
            // Simple routine (like messages)
            setIsCompleted(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRoutineModal, currentRoutine, currentStep, isCompleted]);

  const handleClose = () => {
    dispatch(setShowRoutineModal(false));
    dispatch(setCurrentRoutine(null));
  };

  const handleComplete = async () => {
    if (!currentRoutine) return;

    const duration = Math.floor((Date.now() - startTime) / 1000);

    try {
      await routineAPI.completeRoutine({
        routineRecordId: currentRoutine.id,
        rating: rating || undefined,
        feedback: feedback || undefined,
        duration,
      });

      dispatch(completeCurrentRoutine());
      handleClose();
    } catch (error) {
      console.error('Error completing routine:', error);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!currentRoutine) return null;

  const routine = currentRoutine.routineType;
  const steps = routine.content.steps || [];
  const messages = routine.content.messages || [];
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 100;

  // Get current instruction
  let currentInstruction = '';
  let currentInstructionKo = '';

  if (steps.length > 0 && currentStep < steps.length) {
    currentInstruction = steps[currentStep].instruction;
    currentInstructionKo = steps[currentStep].instructionKo;
  } else if (messages.length > 0) {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    currentInstruction = randomMessage.text;
    currentInstructionKo = randomMessage.textKo;
  }

  return (
    <Dialog
      open={showRoutineModal}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={600}>
            {routine.nameKo}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {!isCompleted && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {totalSteps > 0 && `단계 ${currentStep + 1} / ${totalSteps}`}
            </Typography>
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        {!isCompleted ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              textAlign: 'center',
            }}
          >
            {/* Timer */}
            <Box
              sx={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                border: '8px solid',
                borderColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
              }}
            >
              <Typography variant="h2" fontWeight={700} color="primary.main">
                {timeLeft}
              </Typography>
            </Box>

            {/* Instruction */}
            <Typography variant="h5" gutterBottom fontWeight={500}>
              {currentInstructionKo}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {currentInstruction}
            </Typography>

            {/* Tips */}
            {routine.content.tips && currentStep === 0 && (
              <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 2, width: '100%' }}>
                <Typography variant="body2" color="info.dark">
                  💡 {routine.content.tipsKo || routine.content.tips}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom fontWeight={600}>
              완료했습니다! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              훌륭해요! 루틴을 완료했습니다.
            </Typography>

            {/* Rating */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                이 루틴이 도움이 되었나요?
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
                size="large"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Feedback */}
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="피드백을 남겨주세요 (선택사항)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              variant="outlined"
              sx={{ maxWidth: 400 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {!isCompleted ? (
          <>
            <Button onClick={handleSkip} color="inherit">
              건너뛰기
            </Button>
            <Button onClick={() => setIsCompleted(true)} variant="outlined">
              완료 표시
            </Button>
          </>
        ) : (
          <Button onClick={handleComplete} variant="contained" size="large" fullWidth>
            완료
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RoutineModal;
