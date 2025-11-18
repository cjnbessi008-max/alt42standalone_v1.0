/**
 * Main App Component - Demo module learning page
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import { useSessionState } from './hooks/useSessionState';
import { useDraftAnswer } from './hooks/useDraftAnswer';
import { ResumeSessionPrompt, AutoSaveIndicator } from './components';

// Demo constants
const DEMO_MODULE_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000002';

function App() {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResumePrompt, setShowResumePrompt] = useState(true);

  const {
    sessionState,
    isRestored,
    isSaving,
    error: sessionError,
    updateSessionState,
    completeSession,
  } = useSessionState({
    moduleId: DEMO_MODULE_ID,
    studentId: DEMO_STUDENT_ID,
    autoSaveInterval: 5000, // 5 seconds for demo
  });

  // Get current problem ID from session
  const currentProblemId = sessionState?.session_data.problem_sequence?.[currentProblemIndex] || '00000000-0000-0000-0000-000000000003';

  const {
    draftAnswer,
    isLoaded: isDraftLoaded,
    updateDraftAnswer,
    clearDraft,
    incrementTimeSpent,
  } = useDraftAnswer({
    moduleId: DEMO_MODULE_ID,
    problemId: currentProblemId,
    studentId: DEMO_STUDENT_ID,
    autoSaveDelay: 3000, // 3 seconds for demo
  });

  // Timer for time tracking
  useEffect(() => {
    const timer = setInterval(incrementTimeSpent, 1000);
    return () => clearInterval(timer);
  }, [incrementTimeSpent]);

  // Restore draft answer when loaded
  useEffect(() => {
    if (isDraftLoaded && draftAnswer) {
      setAnswer(draftAnswer.answer || '');
    }
  }, [isDraftLoaded, draftAnswer]);

  // Restore session state
  useEffect(() => {
    if (sessionState && isRestored) {
      setCurrentProblemIndex(sessionState.problem_index);
    }
  }, [sessionState, isRestored]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    updateDraftAnswer({ answer: newAnswer });
  };

  const handleSubmitAnswer = async () => {
    // Clear draft
    await clearDraft();

    // Move to next problem
    const nextIndex = currentProblemIndex + 1;
    const completedProblems = [
      ...(sessionState?.session_data.completed_problems || []),
      currentProblemId,
    ];

    if (sessionState) {
      if (nextIndex >= (sessionState.total_problems || 20)) {
        // Complete session
        await completeSession(100, sessionState?.session_data?.total_time_seconds || 0);
        alert('모든 문제를 완료했습니다! 🎉');
      } else {
        // Move to next problem
        setCurrentProblemIndex(nextIndex);
        setAnswer('');
        updateSessionState({
          ...sessionState,
          problem_index: nextIndex,
          current_problem_id: sessionState.session_data.problem_sequence[nextIndex],
          session_data: {
            ...sessionState.session_data,
            completed_problems: completedProblems,
          },
        });
      }
    }
  };

  const handleResumeSession = (sessionId: string) => {
    console.log('Resuming session:', sessionId);
    setShowResumePrompt(false);
  };

  const handleStartNew = () => {
    console.log('Starting new session');
    setShowResumePrompt(false);
    setCurrentProblemIndex(0);
    setAnswer('');
  };

  if (!sessionState) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  const progress = ((currentProblemIndex / (sessionState.total_problems || 20)) * 100);
  const isCompleted = sessionState.is_completed;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {showResumePrompt && (
        <ResumeSessionPrompt
          moduleId={DEMO_MODULE_ID}
          studentId={DEMO_STUDENT_ID}
          onResume={handleResumeSession}
          onStartNew={handleStartNew}
        />
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            세션 이어하기 데모
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session Resume Feature Demo
          </Typography>
        </Box>

        {/* Auto-save indicator */}
        <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
          <AutoSaveIndicator
            isSaving={isSaving}
            lastSaved={sessionState ? new Date(sessionState.last_active_at) : null}
            error={!!sessionError}
          />
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">진행률</Typography>
            <Typography variant="body2" fontWeight="medium">
              {currentProblemIndex} / {sessionState.total_problems} 문제
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {progress.toFixed(1)}% 완료
          </Typography>
        </Box>

        {/* Status chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {isRestored && (
            <Chip label="이전 세션 복원됨" color="primary" size="small" />
          )}
          {isCompleted && (
            <Chip label="완료됨" color="success" size="small" />
          )}
        </Stack>

        {/* Problem */}
        {!isCompleted && (
          <Box>
            <Typography variant="h6" gutterBottom>
              문제 {currentProblemIndex + 1}
            </Typography>
            <Typography variant="body1" paragraph>
              다음 분수를 소수로 변환하세요: <strong>3/4</strong>
            </Typography>

            <TextField
              fullWidth
              label="답안 입력"
              value={answer}
              onChange={handleAnswerChange}
              placeholder="예: 0.75"
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmitAnswer}
              disabled={!answer.trim()}
            >
              제출하기
            </Button>
          </Box>
        )}

        {isCompleted && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              🎉 축하합니다!
            </Typography>
            <Typography variant="body1">
              모든 문제를 완료했습니다.
            </Typography>
          </Box>
        )}

        {/* Debug info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" component="div">
            <strong>디버그 정보:</strong>
          </Typography>
          <Typography variant="caption" component="div">
            세션 ID: {sessionState.id}
          </Typography>
          <Typography variant="caption" component="div">
            현재 문제: {currentProblemIndex + 1} / {sessionState.total_problems}
          </Typography>
          <Typography variant="caption" component="div">
            완료한 문제: {sessionState.session_data.completed_problems.length}
          </Typography>
          <Typography variant="caption" component="div">
            임시 답안: {draftAnswer ? 'O' : 'X'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
