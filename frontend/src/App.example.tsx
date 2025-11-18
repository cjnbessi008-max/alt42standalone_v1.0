/**
 * Example Usage of Emotional Color Mode System
 * This file demonstrates how to integrate the emotion-based color mode system
 * into your React application.
 */

import React from 'react';
import { Container, Typography, Box, Button, TextField } from '@mui/material';

import { EmotionalThemeProvider } from './contexts/EmotionalThemeContext';
import { BehaviorTracker, trackFormError, trackFormSubmit } from './components/BehaviorTracker';
import ColorModeSelector from './components/ColorModeSelector';

// ============================================================================
// Example Student Learning Interface
// ============================================================================

const StudentLearningPage: React.FC = () => {
  const [answer, setAnswer] = React.useState('');
  const [retryCount, setRetryCount] = React.useState(0);

  const handleSubmit = () => {
    // Validate answer
    const isCorrect = answer.toLowerCase() === 'correct';

    if (isCorrect) {
      // Track successful submission
      trackFormSubmit(123, { answer, correct: true });
      alert('Correct!');
      setRetryCount(0);
    } else {
      // Track error
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      trackFormError('answer-input', newRetryCount, { answer, correct: false });
      alert('Try again!');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Math Problem
      </Typography>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          What is 2 + 2?
        </Typography>

        <TextField
          id="answer-input"
          fullWidth
          label="Your Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ mt: 2 }}
          fullWidth
        >
          Submit Answer
        </Button>

        {retryCount > 0 && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Attempt {retryCount + 1}
          </Typography>
        )}
      </Box>

      <Typography variant="body1" color="text.secondary">
        The color theme will automatically adjust based on your emotional state while learning.
        Try making errors to trigger the calming mode, or work steadily to maintain neutral mode.
      </Typography>
    </Container>
  );
};

// ============================================================================
// Main App Component with Emotion System Integration
// ============================================================================

const App: React.FC = () => {
  // In a real application, these would come from your authentication/session system
  const studentId = 12345;
  const sessionId = `session_${Date.now()}`;

  return (
    <EmotionalThemeProvider
      studentId={studentId}
      sessionId={sessionId}
      apiBaseUrl="/api/v1"
      wsBaseUrl={process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}
      initialMode="neutral"
      enableNotifications={true}
    >
      <BehaviorTracker
        studentId={studentId}
        sessionId={sessionId}
        apiBaseUrl="/api/v1"
        batchSize={10}
        batchIntervalMs={5000}
        enabled={true}
        trackClicks={true}
        trackKeyboard={true}
        trackScroll={true}
        trackFocus={true}
        trackErrors={true}
      >
        {/* Your application content */}
        <StudentLearningPage />

        {/* Color Mode Selector UI */}
        <ColorModeSelector
          position="bottom-right"
          defaultExpanded={false}
          showConnectionStatus={true}
        />
      </BehaviorTracker>
    </EmotionalThemeProvider>
  );
};

export default App;

// ============================================================================
// Integration Notes
// ============================================================================

/**
 * INTEGRATION CHECKLIST:
 *
 * 1. Install Dependencies:
 *    npm install @mui/material @emotion/react @emotion/styled socket.io-client
 *
 * 2. Wrap your app with EmotionalThemeProvider:
 *    - Provide studentId and sessionId from your auth system
 *    - Configure apiBaseUrl and wsBaseUrl for your backend
 *
 * 3. Add BehaviorTracker:
 *    - Wrap your main content to track user interactions
 *    - Optionally use trackFormError() and trackFormSubmit() for manual tracking
 *
 * 4. Add ColorModeSelector (optional):
 *    - Provides UI for manual mode selection
 *    - Can be hidden if you want fully automatic mode only
 *
 * 5. Backend Setup:
 *    - Ensure FastAPI backend is running with emotion detection routes
 *    - Database tables must be created (run migration SQL)
 *    - WebSocket endpoint must be accessible
 *
 * 6. Environment Variables:
 *    - REACT_APP_WS_URL: WebSocket server URL (e.g., ws://localhost:8000)
 *    - REACT_APP_API_URL: REST API base URL (e.g., http://localhost:8000)
 *
 * ADVANCED USAGE:
 *
 * Access emotion state in components:
 *
 *   import { useEmotionalTheme } from './contexts/EmotionalThemeContext';
 *
 *   const MyComponent = () => {
 *     const { currentMode, emotionalState, autoModeEnabled } = useEmotionalTheme();
 *
 *     return (
 *       <div>
 *         Current mode: {currentMode}
 *         Detected emotion: {emotionalState}
 *       </div>
 *     );
 *   };
 *
 * Update preferences programmatically:
 *
 *   const { updatePreferences } = useEmotionalTheme();
 *
 *   await updatePreferences({
 *     auto_mode_enabled: false,
 *     preferred_default_mode: 'calming',
 *     emotion_detection_sensitivity: 'high',
 *   });
 *
 * Manual mode switching:
 *
 *   const { setManualMode } = useEmotionalTheme();
 *
 *   setManualMode('calming'); // Switch to calming mode
 */
