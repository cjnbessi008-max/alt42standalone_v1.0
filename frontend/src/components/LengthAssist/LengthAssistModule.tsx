// Main Length Assist Module Component

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useLengthAssistStore } from '@/store/useLengthAssistStore';
import GeometryCanvas from './GeometryCanvas';
import RatioDisplay from './RatioDisplay';
import LineSelector from './LineSelector';
import lengthAssistApi from '@/services/lengthAssist.api';

interface LengthAssistModuleProps {
  moduleId: string;
  studentId: string;
  problemId?: string;
}

const LengthAssistModule: React.FC<LengthAssistModuleProps> = ({
  moduleId,
  studentId,
  problemId,
}) => {
  const {
    currentProblem,
    lines,
    canvasConfig,
    selectedLineId,
    currentRatio,
    interactions,
    startTime,
    isLoading,
    error,
    showHints,
    setProblem,
    updateLine,
    selectLine,
    calculateCurrentRatio,
    startProblem,
    submitAnswer,
    resetProblem,
    setLoading,
    setError,
    toggleHints,
  } = useLengthAssistStore();

  const [selectedLine1Id, setSelectedLine1Id] = useState<string | null>(null);
  const [selectedLine2Id, setSelectedLine2Id] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load problem on mount
  useEffect(() => {
    loadProblem();
  }, [moduleId, problemId]);

  const loadProblem = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (problemId) {
        response = await lengthAssistApi.getProblem(problemId);
      } else {
        response = await lengthAssistApi.getNextProblem(studentId, moduleId);
      }

      if (response.success && response.data) {
        setProblem(response.data);
        startProblem();
      } else {
        setError(response.error || 'Failed to load problem');
      }
    } catch (err) {
      setError('Failed to load problem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRatio = () => {
    if (selectedLine1Id && selectedLine2Id) {
      calculateCurrentRatio(selectedLine1Id, selectedLine2Id);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentRatio || !currentProblem || !startTime) {
      setError('Please calculate a ratio first');
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await lengthAssistApi.submitAnswer({
        problemId: currentProblem.id,
        studentId,
        measuredRatio: {
          line1Length: currentRatio.line1Length,
          line2Length: currentRatio.line2Length,
          ratio: currentRatio.ratio,
        },
        timeSpent,
        interactions,
      });

      if (response.success && response.data) {
        setFeedback(response.data.feedback);
        submitAnswer();

        // Auto-load next problem after 3 seconds if correct
        if (response.data.isCorrect && response.data.nextProblemId) {
          setTimeout(() => {
            loadProblem();
          }, 3000);
        }
      } else {
        setError(response.error || 'Failed to submit answer');
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !currentProblem) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Length Assist
          </Typography>
          <IconButton color="inherit" onClick={toggleHints}>
            <HelpIcon />
          </IconButton>
          <IconButton color="inherit" onClick={resetProblem}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth="sm"
        sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}
      >
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <Alert
            severity={feedback.includes('정답') ? 'success' : 'info'}
            sx={{ mb: 2 }}
            onClose={() => setFeedback(null)}
          >
            {feedback}
          </Alert>
        )}

        {/* Problem Description */}
        {currentProblem && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {currentProblem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentProblem.description}
            </Typography>
          </Box>
        )}

        {/* Hints */}
        {showHints && currentProblem?.hints && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              힌트:
            </Typography>
            {currentProblem.hints.map((hint, index) => (
              <Typography key={index} variant="body2">
                {index + 1}. {hint}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Geometry Canvas */}
        <Box sx={{ mb: 2 }}>
          <GeometryCanvas
            lines={lines}
            config={canvasConfig}
            selectedLineId={selectedLineId}
            onLineUpdate={updateLine}
            onLineSelect={selectLine}
          />
        </Box>

        {/* Line Selector */}
        {lines.length >= 2 && (
          <LineSelector
            lines={lines}
            selectedLine1Id={selectedLine1Id}
            selectedLine2Id={selectedLine2Id}
            onSelectLine1={setSelectedLine1Id}
            onSelectLine2={setSelectedLine2Id}
            onCalculate={handleCalculateRatio}
          />
        )}

        {/* Ratio Display */}
        <RatioDisplay ratio={currentRatio} />

        {/* Submit Button */}
        {currentRatio && (
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSubmitAnswer}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? '제출 중...' : '답안 제출'}
          </Button>
        )}

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" component="div">
              <strong>Debug Info:</strong>
            </Typography>
            <Typography variant="caption" component="div">
              Lines: {lines.length}
            </Typography>
            <Typography variant="caption" component="div">
              Interactions: {interactions.length}
            </Typography>
            <Typography variant="caption" component="div">
              Time: {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default LengthAssistModule;
