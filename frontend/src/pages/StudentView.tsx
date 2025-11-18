/**
 * Student Learning View
 * Main interface for students with automatic event tracking
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import DmnDriftMonitor from '../components/DmnDriftMonitor';
import eventTracker from '../utils/eventTracker';
import api from '../services/api';
import { LearningSession, DmnDriftMetrics } from '../types';

interface StudentViewProps {
  studentId: number;
  moduleName: string;
}

const StudentView: React.FC<StudentViewProps> = ({ studentId, moduleName }) => {
  const [session, setSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState<string | null>(null);

  useEffect(() => {
    // Auto-start session on mount
    startSession();

    // Cleanup on unmount
    return () => {
      if (session) {
        endSession();
      }
    };
  }, []);

  const startSession = async () => {
    setLoading(true);
    try {
      const newSession = await api.createSession(studentId, moduleName);
      setSession(newSession);

      // Initialize event tracking
      eventTracker.initialize(newSession.id, studentId);

      console.log('Session started:', newSession);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      // Cleanup event tracker
      eventTracker.cleanup();

      // End session
      await api.endSession(session.id);

      // Send final grade to Moodle if integrated
      try {
        await api.sendGradeToMoodle(session.id);
      } catch (error) {
        console.log('Grade sync not available or failed');
      }

      console.log('Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleInterventionNeeded = (metrics: DmnDriftMetrics) => {
    if (metrics.recommended_action) {
      setInterventionMessage(metrics.recommended_action);

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setInterventionMessage(null);
      }, 10000);
    }
  };

  const handleAnswerSubmit = (problemId: string, isCorrect: boolean, responseTime: number) => {
    // Track answer submission
    eventTracker.trackAnswerSubmit(problemId, isCorrect, responseTime);

    // You would also submit to your problem API here
  };

  if (loading && !session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Starting your learning session...
        </Typography>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to start session. Please try again.
        </Alert>
        <Button
          variant="contained"
          onClick={startSession}
          sx={{ mt: 2 }}
          startIcon={<PlayArrow />}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {moduleName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Session started: {new Date(session.session_start).toLocaleTimeString()}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Stop />}
          onClick={endSession}
        >
          End Session
        </Button>
      </Box>

      {/* Intervention Alert */}
      {interventionMessage && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setInterventionMessage(null)}>
          <Typography variant="subtitle1" fontWeight="bold">
            Tip from your teacher
          </Typography>
          {interventionMessage}
        </Alert>
      )}

      {/* DMN Drift Monitor (visible to student - optional) */}
      <Box mb={3}>
        <DmnDriftMonitor
          sessionId={session.id}
          refreshInterval={30000}
          onInterventionNeeded={handleInterventionNeeded}
        />
      </Box>

      {/* Learning Content Area */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Learning Activity
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            This is where your learning content would appear.
            All your interactions are being tracked to help improve your learning experience.
          </Alert>

          {/* Example Problem */}
          <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sample Problem
            </Typography>
            <Typography variant="body1" paragraph>
              What is 2 + 2?
            </Typography>

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => handleAnswerSubmit('problem-1', false, 5.2)}
              >
                3
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleAnswerSubmit('problem-1', true, 3.5)}
              >
                4
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleAnswerSubmit('problem-1', false, 7.1)}
              >
                5
              </Button>
            </Box>
          </Box>

          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
            💡 All your clicks, scrolls, and interactions are tracked to monitor your engagement.
            This helps your teacher provide better support!
          </Typography>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Progress
          </Typography>
          <Box display="flex" gap={4}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Activities
              </Typography>
              <Typography variant="h5">
                {session.activity_count || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Duration
              </Typography>
              <Typography variant="h5">
                {Math.floor((Date.now() - new Date(session.session_start).getTime()) / 60000)} min
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentView;
