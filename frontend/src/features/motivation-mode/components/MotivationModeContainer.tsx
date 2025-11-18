/**
 * Motivation Mode Container Component
 *
 * Main container that orchestrates the motivation mode experience
 */

import React, { useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useMotivationSession } from '../hooks/useMotivationSession';
import { ModeTrigger, ExitReason } from '../types/motivationMode.types';
import { MotivationModeHeader } from './MotivationModeHeader';
import { SingleProblemView } from './SingleProblemView';
import { FeedbackDisplay } from './FeedbackDisplay';
import { SessionSummary } from './SessionSummary';

interface MotivationModeContainerProps {
  moduleId: string;
  onExit?: () => void;
  initialTrigger?: ModeTrigger;
}

export const MotivationModeContainer: React.FC<MotivationModeContainerProps> = ({
  moduleId,
  onExit,
  initialTrigger = ModeTrigger.STUDENT_INITIATED,
}) => {
  const [hasStarted, setHasStarted] = useState(false);

  const {
    sessionId,
    currentProblem,
    feedback,
    summary,
    isLoading,
    error,
    currentStreak,
    problemsCompleted,
    problemsCorrect,
    startSession,
    submitAnswer,
    continueSession,
    endSession,
    resetFeedback,
  } = useMotivationSession({
    moduleId,
    onSessionEnd: (summary) => {
      console.log('Session ended:', summary);
    },
    onError: (error) => {
      console.error('Motivation mode error:', error);
    },
  });

  // Auto-start session on mount
  React.useEffect(() => {
    if (!hasStarted) {
      startSession(initialTrigger);
      setHasStarted(true);
    }
  }, [hasStarted, startSession, initialTrigger]);

  const handleExit = async () => {
    if (sessionId) {
      await endSession(ExitReason.STUDENT_CHOICE);
    }
    onExit?.();
  };

  const handleContinue = async () => {
    resetFeedback();
    await continueSession();
  };

  const handleSummaryClose = () => {
    onExit?.();
  };

  // Loading state
  if (!hasStarted || (isLoading && !currentProblem && !feedback)) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="error" onClose={onExit}>
          오류가 발생했습니다: {error.message}
        </Alert>
      </Box>
    );
  }

  // Summary state (session ended)
  if (summary) {
    return <SessionSummary summary={summary} onClose={handleSummaryClose} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
      }}
    >
      {/* Header */}
      <MotivationModeHeader
        onExit={handleExit}
        showStreak={true}
        currentStreak={currentStreak}
      />

      {/* Main Content */}
      {feedback ? (
        // Show feedback after answer submission
        <FeedbackDisplay
          feedback={feedback}
          onContinue={handleContinue}
          onExit={handleExit}
        />
      ) : currentProblem ? (
        // Show current problem
        <SingleProblemView
          problem={currentProblem}
          onSubmit={submitAnswer}
          isLoading={isLoading}
        />
      ) : (
        // Loading next problem
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};
