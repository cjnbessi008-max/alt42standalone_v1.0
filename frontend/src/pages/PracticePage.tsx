import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';

import { useStore } from '../stores/useStore';
import { problemApi } from '../services/api';
import { DifficultyLevel, ProblemType } from '../types';

import ProblemDisplay from '../components/ProblemDisplay';
import FractionInput from '../components/FractionInput';
import FeedbackDisplay from '../components/FeedbackDisplay';

const PracticePage = () => {
  const {
    currentProblem,
    setCurrentProblem,
    studentAnswer,
    setStudentAnswer,
    submissionResult,
    setSubmissionResult,
    isLoading,
    setIsLoading,
    error,
    setError,
    getTimeSpent,
    reset,
    currentStudentId,
  } = useStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
  const [selectedType, setSelectedType] = useState<ProblemType>('fraction_addition');

  // Load initial problem
  useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      reset();

      const problem = await problemApi.getRandom(selectedType, selectedDifficulty);
      setCurrentProblem(problem);
    } catch (err: any) {
      setError(err.response?.data?.message || '문제를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentProblem || !studentAnswer) {
      setError('답을 입력해주세요.');
      return;
    }

    if (studentAnswer.denominator === 0) {
      setError('분모는 0이 될 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const timeSpent = getTimeSpent();
      const result = await problemApi.submitAnswer(
        currentProblem.id,
        studentAnswer,
        timeSpent,
        currentStudentId
      );

      setSubmissionResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || '답안 제출에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    loadNewProblem();
  };

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        분수 계산 연습
      </Typography>

      {/* Settings */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>문제 유형</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ProblemType)}
                label="문제 유형"
                disabled={isLoading}
              >
                <MenuItem value="fraction_addition">분수 덧셈</MenuItem>
                <MenuItem value="fraction_subtraction">분수 뺄셈</MenuItem>
                <MenuItem value="fraction_multiplication">분수 곱셈</MenuItem>
                <MenuItem value="fraction_division">분수 나눗셈</MenuItem>
                <MenuItem value="fraction_simplification">분수 간단히 하기</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>난이도</InputLabel>
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                label="난이도"
                disabled={isLoading}
              >
                <MenuItem value="easy">쉬움</MenuItem>
                <MenuItem value="medium">보통</MenuItem>
                <MenuItem value="hard">어려움</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadNewProblem}
              disabled={isLoading}
              sx={{ height: 56 }}
            >
              새 문제
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && !currentProblem && (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Problem Display */}
      {currentProblem && !submissionResult && (
        <Box>
          <ProblemDisplay problem={currentProblem} />

          <Box mt={4}>
            <FractionInput
              value={studentAnswer}
              onChange={setStudentAnswer}
              disabled={isLoading}
              error={!!error}
            />
          </Box>

          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSubmit}
              disabled={isLoading || !studentAnswer}
              sx={{ px: 6, py: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : '제출'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Feedback Display */}
      {submissionResult && <FeedbackDisplay result={submissionResult} onNext={handleNext} />}
    </Box>
  );
};

export default PracticePage;
