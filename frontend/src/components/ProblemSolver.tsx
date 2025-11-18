import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { problemApi, predictionApi } from '../services/api';
import type { Problem, PredictionResponse, AttemptResponse } from '../types';
import WrongAnswerPredictionModal from './WrongAnswerPredictionModal';

const ProblemSolver: React.FC = () => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [numerator, setNumerator] = useState<string>('');
  const [denominator, setDenominator] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [result, setResult] = useState<AttemptResponse | null>(null);
  const [studentId] = useState('student_' + Math.random().toString(36).substr(2, 9));

  // 문제 로드
  useEffect(() => {
    loadProblem();
  }, []);

  const loadProblem = async () => {
    try {
      const problems = await problemApi.getProblems();
      if (problems.length > 0) {
        setProblem(problems[0]);
      } else {
        // 샘플 문제 생성
        const newProblem = await problemApi.createProblem({
          problem_type: 'fraction_addition',
          question_text: '1/2 + 1/3 = ?',
          correct_numerator: 5,
          correct_denominator: 6,
          difficulty: 'medium',
        });
        setProblem(newProblem);
      }
    } catch (error) {
      console.error('Failed to load problem:', error);
    }
  };

  const handlePredict = async () => {
    if (!problem || !numerator || !denominator) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const predictionResponse = await predictionApi.predictAnswer({
        student_id: studentId,
        problem_id: problem.id,
        answer_numerator: parseInt(numerator),
        answer_denominator: parseInt(denominator),
        correct_numerator: problem.correct_numerator,
        correct_denominator: problem.correct_denominator,
      });

      setPrediction(predictionResponse);

      // 오답일 가능성이 높고, 신뢰도가 충분히 높으면 팝업 표시
      if (predictionResponse.is_likely_wrong && predictionResponse.confidence > 0.6) {
        setShowPredictionModal(true);
      } else {
        // 정답이거나 신뢰도가 낮으면 바로 제출
        await submitAnswer();
      }
    } catch (error) {
      console.error('Prediction failed:', error);
      // 예측 실패 시 바로 제출
      await submitAnswer();
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!problem || !numerator || !denominator) {
      return;
    }

    setLoading(true);
    setShowPredictionModal(false);

    try {
      const attemptResponse = await predictionApi.submitAnswer({
        student_id: studentId,
        problem_id: problem.id,
        answer_numerator: parseInt(numerator),
        answer_denominator: parseInt(denominator),
      });

      setResult(attemptResponse);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = () => {
    setShowPredictionModal(false);
    // 포커스를 입력 필드로 이동
    setNumerator('');
    setDenominator('');
  };

  const handleNextProblem = () => {
    setNumerator('');
    setDenominator('');
    setResult(null);
    setPrediction(null);
    loadProblem();
  };

  if (!problem) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>문제를 불러오는 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          분수 문제 풀이
        </Typography>

        <Typography variant="caption" display="block" gutterBottom align="center" color="text.secondary">
          AI가 오답을 예측하여 도움을 줍니다
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Card variant="outlined" sx={{ bgcolor: 'primary.light', p: 2 }}>
            <CardContent>
              <Typography variant="h5" align="center" color="primary.contrastText">
                {problem.question_text}
              </Typography>
              <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }} color="primary.contrastText">
                난이도: {problem.difficulty}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="분자"
              type="number"
              value={numerator}
              onChange={(e) => setNumerator(e.target.value)}
              disabled={loading || result !== null}
              variant="outlined"
              size="large"
              inputProps={{ style: { fontSize: 24, textAlign: 'center' } }}
            />
          </Grid>
          <Grid item xs={2} sx={{ textAlign: 'center' }}>
            <Typography variant="h4">/</Typography>
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="분모"
              type="number"
              value={denominator}
              onChange={(e) => setDenominator(e.target.value)}
              disabled={loading || result !== null}
              variant="outlined"
              size="large"
              inputProps={{ style: { fontSize: 24, textAlign: 'center' } }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          {!result ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handlePredict}
              disabled={!numerator || !denominator || loading}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : '답 제출하기'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleNextProblem}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              다음 문제
            </Button>
          )}
        </Box>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity={result.is_correct ? 'success' : 'error'}
              icon={result.is_correct ? <CheckCircleIcon /> : <CancelIcon />}
              sx={{ fontSize: 16 }}
            >
              <Typography variant="h6">{result.message}</Typography>
              {!result.is_correct && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  정답: {result.correct_answer}
                </Typography>
              )}
            </Alert>
          </Box>
        )}
      </Paper>

      <WrongAnswerPredictionModal
        open={showPredictionModal}
        prediction={prediction}
        onReview={handleReview}
        onSubmitAnyway={submitAnswer}
      />
    </Container>
  );
};

export default ProblemSolver;
