import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Grid, Paper, Typography } from '@mui/material';
import MetacognitiveMirror from '../components/MetacognitiveMirror';
import ProblemUI from '../components/ProblemUI';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLearningSession } from '../hooks/useLearningSession';

export default function LearningSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [currentSummary, setCurrentSummary] = useState('');
  const [stepHistory, setStepHistory] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { session, currentStep, steps } = useLearningSession(sessionId!);
  const { connected, sendAction } = useWebSocket(sessionId!);

  useEffect(() => {
    if (steps) {
      const history = steps.map((step: any, index: number) => ({
        stepNumber: step.step_number,
        stepType: step.step_type,
        summary: step.metacognitive_summary,
        durationSeconds: step.duration_seconds,
        status:
          index < steps.length - 1
            ? 'completed'
            : step.ended_at
            ? 'completed'
            : 'active',
      }));
      setStepHistory(history);
    }
  }, [steps]);

  useEffect(() => {
    if (currentStep?.metacognitive_summary) {
      setCurrentSummary(currentStep.metacognitive_summary);
    }
    if (currentStep?.cognitive_strategies) {
      setStrategies(currentStep.cognitive_strategies);
    }
  }, [currentStep]);

  const handleAction = (actionType: string, actionData: any) => {
    sendAction(actionType, actionData);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        학습 세션
      </Typography>

      {!connected && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'warning.light' }}>
          <Typography>연결 중...</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Problem UI - Left Side */}
        <Grid item xs={12} md={7}>
          <ProblemUI
            sessionId={sessionId!}
            onAction={handleAction}
          />
        </Grid>

        {/* Metacognitive Mirror - Right Side */}
        <Grid item xs={12} md={5}>
          <MetacognitiveMirror
            currentSummary={currentSummary}
            currentStep={currentStep?.step_number || 1}
            totalSteps={session?.total_steps || 5}
            stepHistory={stepHistory}
            strategies={strategies}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
