/**
 * Transform Vector Main Component
 * Integrates VectorCanvas and provides problem selection UI
 */
import React, { useState, useEffect } from 'react';
import { VectorCanvas } from './VectorCanvas';
import { VectorProblem, StudentAttempt } from '../../types/vector';
import { vectorAPI } from '../../services/api';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Grid,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const TransformVector: React.FC = () => {
  const [problems, setProblems] = useState<VectorProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<VectorProblem | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState({ x: '', y: '' });
  const [submitResult, setSubmitResult] = useState<{ correct: boolean; message: string } | null>(null);

  // Dummy student ID for demo purposes
  const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vectorAPI.getProblems();
      setProblems(data);
      if (data.length > 0) {
        setCurrentProblem(data[0]);
      }
    } catch (err: any) {
      setError(err.message || '문제를 불러오는 중 오류가 발생했습니다.');
      console.error('Error loading problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRandomProblem = async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    setSubmitResult(null);
    setUserAnswer({ x: '', y: '' });
    try {
      const problem = await vectorAPI.getRandomProblem(difficulty);
      setCurrentProblem(problem);
    } catch (err: any) {
      setError(err.message || '문제를 불러오는 중 오류가 발생했습니다.');
      console.error('Error loading random problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentProblem) return;

    const answerX = parseFloat(userAnswer.x);
    const answerY = parseFloat(userAnswer.y);

    if (isNaN(answerX) || isNaN(answerY)) {
      setSubmitResult({
        correct: false,
        message: '올바른 숫자를 입력해주세요.',
      });
      return;
    }

    try {
      const attempt: StudentAttempt = {
        student_id: DEMO_STUDENT_ID,
        problem_id: currentProblem.id,
        answer_x: answerX,
        answer_y: answerY,
        time_spent_seconds: 0,
        hint_used: showResult,
      };

      const response = await vectorAPI.submitAttempt(attempt);

      setSubmitResult({
        correct: response.is_correct,
        message: response.is_correct
          ? '정답입니다! 🎉'
          : `아쉽게도 틀렸습니다. 정답: (${currentProblem.expected_x}, ${currentProblem.expected_y})`,
      });

      if (!response.is_correct) {
        setShowResult(true);
      }
    } catch (err: any) {
      setError(err.message || '답안 제출 중 오류가 발생했습니다.');
      console.error('Error submitting attempt:', err);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    switch (type) {
      case 'rotation':
        return '회전';
      case 'scaling':
        return '신장';
      case 'combined':
        return '회전+신장';
      default:
        return type;
    }
  };

  if (loading && !currentProblem) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2196F3' }}>
        벡터 변환 학습 시스템
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                문제 선택
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>난이도</InputLabel>
                <Select
                  value={difficulty}
                  label="난이도"
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                >
                  <MenuItem value={1}>레벨 1 (쉬움)</MenuItem>
                  <MenuItem value={2}>레벨 2</MenuItem>
                  <MenuItem value={3}>레벨 3</MenuItem>
                  <MenuItem value={4}>레벨 4</MenuItem>
                  <MenuItem value={5}>레벨 5 (어려움)</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadRandomProblem}
                disabled={loading}
                sx={{ mb: 3 }}
              >
                새 문제 불러오기
              </Button>

              {currentProblem && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getProblemTypeLabel(currentProblem.problem_type)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`난이도 ${currentProblem.difficulty_level}`}
                      color="secondary"
                      size="small"
                    />
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    문제 정보
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    초기 벡터: ({currentProblem.initial_x}, {currentProblem.initial_y})
                  </Typography>

                  {currentProblem.rotation_angle !== undefined && currentProblem.rotation_angle !== null && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      회전: {currentProblem.rotation_angle}°
                    </Typography>
                  )}

                  {currentProblem.scale_x !== undefined && currentProblem.scale_y !== undefined && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      스케일: X={currentProblem.scale_x}x, Y={currentProblem.scale_y}x
                    </Typography>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      변환 후 벡터 예측
                    </Typography>
                    <TextField
                      fullWidth
                      label="X 좌표"
                      type="number"
                      value={userAnswer.x}
                      onChange={(e) => setUserAnswer({ ...userAnswer, x: e.target.value })}
                      sx={{ mb: 1 }}
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Y 좌표"
                      type="number"
                      value={userAnswer.y}
                      onChange={(e) => setUserAnswer({ ...userAnswer, y: e.target.value })}
                      sx={{ mb: 2 }}
                      size="small"
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleSubmitAnswer}
                    >
                      답안 제출
                    </Button>
                  </Box>

                  {submitResult && (
                    <Alert
                      severity={submitResult.correct ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {submitResult.message}
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowResult(!showResult)}
                    sx={{ mt: 2 }}
                  >
                    {showResult ? '정답 숨기기' : '정답 보기'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vector Canvas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {currentProblem ? (
                <VectorCanvas
                  problem={currentProblem}
                  showResult={showResult}
                  onAnimationComplete={() => {
                    console.log('Animation completed');
                  }}
                />
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="400px"
                >
                  <Typography color="text.secondary">
                    문제를 선택해주세요
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
