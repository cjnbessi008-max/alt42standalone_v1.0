/**
 * FatigueMonitoringContainer Component
 *
 * Complete integration example showing how to use all fatigue monitoring components together.
 * This component wraps a learning module and adds fatigue monitoring capabilities.
 */

import React, { useEffect, useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import FatigueIndicator from './FatigueIndicator';
import BreakNotificationModal from './BreakNotificationModal';
import BreakTimer from './BreakTimer';
import { useFatigueMonitoring } from '../../hooks/useFatigueMonitoring';

interface FatigueMonitoringContainerProps {
  studentId: string;
  moduleId: string;
  children: React.ReactNode;
  onMetricUpdate?: (fatigueScore: number) => void;
}

const FatigueMonitoringContainer: React.FC<FatigueMonitoringContainerProps> = ({
  studentId,
  moduleId,
  children,
  onMetricUpdate
}) => {
  const {
    fatigueState,
    currentRecommendation,
    isConnected,
    error,
    startSession,
    endSession,
    recordMetric,
    acceptBreak,
    dismissBreak,
    deferBreak,
    completeBreak
  } = useFatigueMonitoring(studentId);

  const [isOnBreak, setIsOnBreak] = useState(false);
  const [acceptedRecommendation, setAcceptedRecommendation] = useState<any>(null);
  const [showError, setShowError] = useState(false);

  // Start session on mount
  useEffect(() => {
    startSession(studentId, moduleId);

    return () => {
      endSession();
    };
  }, [studentId, moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call onMetricUpdate when fatigue changes
  useEffect(() => {
    if (onMetricUpdate) {
      onMetricUpdate(fatigueState.fatigueScore);
    }
  }, [fatigueState.fatigueScore, onMetricUpdate]);

  // Show error notification
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Handle learning interaction (call this from child components)
  const handleLearningInteraction = (data: {
    complexityLevel: number;
    problemsCompleted: number;
    correctAnswers: number;
    responseTimes: number[];
  }) => {
    recordMetric({
      ...data,
      interactionCount: 1 // Increment on each interaction
    });
  };

  // Handle break acceptance
  const handleAcceptBreak = (recommendationId: string) => {
    if (currentRecommendation) {
      acceptBreak(recommendationId);
      setIsOnBreak(true);
      setAcceptedRecommendation(currentRecommendation);
    }
  };

  // Handle break dismissal
  const handleDismissBreak = (recommendationId: string, reason: string) => {
    dismissBreak(recommendationId, reason);
  };

  // Handle break deferral
  const handleDeferBreak = (recommendationId: string, minutes: number) => {
    deferBreak(recommendationId, minutes);
  };

  // Handle break completion
  const handleCompleteBreak = (actualDuration: number, activities: string[]) => {
    if (acceptedRecommendation) {
      completeBreak(acceptedRecommendation.id, actualDuration, activities);
      setIsOnBreak(false);
      setAcceptedRecommendation(null);
    }
  };

  // Handle break cancellation
  const handleCancelBreak = () => {
    setIsOnBreak(false);
    if (acceptedRecommendation) {
      dismissBreak(acceptedRecommendation.id, '사용자가 중단함');
      setAcceptedRecommendation(null);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Fatigue Indicator - Fixed position */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <FatigueIndicator
          fatigueScore={fatigueState.fatigueScore}
          fatigueLevel={fatigueState.fatigueLevel}
          trend={fatigueState.trend}
          showDetails={true}
          size="medium"
        />

        {/* Connection status indicator */}
        {!isConnected && fatigueState.isActive && (
          <Box
            sx={{
              mt: 1,
              p: 0.5,
              bgcolor: 'error.light',
              color: 'white',
              fontSize: '0.7rem',
              textAlign: 'center',
              borderRadius: 1
            }}
          >
            연결 끊김
          </Box>
        )}
      </Box>

      {/* Learning content */}
      {!isOnBreak && (
        <Box>
          {/* Pass handleLearningInteraction to children via context or props */}
          {children}
        </Box>
      )}

      {/* Break Timer - Shown during break */}
      {isOnBreak && acceptedRecommendation && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'grey.50'
          }}
        >
          <BreakTimer
            durationMinutes={acceptedRecommendation.durationMinutes}
            onComplete={handleCompleteBreak}
            onCancel={handleCancelBreak}
            autoStart={true}
          />
        </Box>
      )}

      {/* Break Recommendation Modal */}
      <BreakNotificationModal
        open={!!currentRecommendation && !isOnBreak}
        recommendation={currentRecommendation}
        onAccept={handleAcceptBreak}
        onDismiss={handleDismissBreak}
        onDefer={handleDeferBreak}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FatigueMonitoringContainer;


/**
 * Example Usage:
 *
 * import FatigueMonitoringContainer from './components/fatigue/FatigueMonitoringContainer';
 *
 * function LearningModule() {
 *   return (
 *     <FatigueMonitoringContainer
 *       studentId="student-uuid"
 *       moduleId="module-uuid"
 *       onMetricUpdate={(score) => console.log('Fatigue:', score)}
 *     >
 *       <YourLearningContent />
 *     </FatigueMonitoringContainer>
 *   );
 * }
 */
