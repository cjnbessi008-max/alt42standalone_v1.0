import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { useStore } from '../stores/useStore';
import { studentApi } from '../services/api';
import { StudentProgress, ErrorPattern, PerformanceSummary } from '../types';

const ProgressPage = () => {
  const { currentStudentId } = useStore();
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [currentStudentId]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [progressData, errorData, summaryData] = await Promise.all([
        studentApi.getProgress(currentStudentId),
        studentApi.getErrorPatterns(currentStudentId),
        studentApi.getPerformanceSummary(currentStudentId),
      ]);

      setProgress(progressData);
      setErrorPatterns(errorData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.message || '진도 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProblemTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      fraction_addition: '분수 덧셈',
      fraction_subtraction: '분수 뺄셈',
      fraction_multiplication: '분수 곱셈',
      fraction_division: '분수 나눗셈',
      fraction_simplification: '분수 간단히 하기',
      fraction_visualization: '분수 시각화',
    };
    return labels[type] || type;
  };

  const getErrorTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      arithmetic_error: '계산 실수',
      conceptual_error: '개념 오류',
      simplification_error: '간단히 하기 오류',
      format_error: '형식 오류',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        나의 진도
      </Typography>

      {/* Performance Summary */}
      {summary && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            전체 성적 요약
          </Typography>
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    시도한 문제
                  </Typography>
                  <Typography variant="h4">{summary.problems_attempted}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    정답률
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {summary.overall_accuracy.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    평균 시간
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(summary.avg_time_per_problem)}초
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    활동 일수
                  </Typography>
                  <Typography variant="h4">{summary.days_active}일</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Progress by Problem Type */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          문제 유형별 진도
        </Typography>

        {progress.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            아직 푼 문제가 없습니다. 연습을 시작해보세요!
          </Typography>
        ) : (
          <Grid container spacing={2} mt={1}>
            {progress.map((p) => (
              <Grid item xs={12} key={p.problem_type}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{getProblemTypeLabel(p.problem_type)}</Typography>
                      <Chip
                        label={p.current_difficulty}
                        color={
                          p.current_difficulty === 'easy'
                            ? 'success'
                            : p.current_difficulty === 'medium'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          정답률
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {p.accuracy_percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={p.accuracy_percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={
                          p.accuracy_percentage >= 80
                            ? 'success'
                            : p.accuracy_percentage >= 60
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          시도 횟수
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {p.total_attempts}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          정답 수
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {p.correct_attempts}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          평균 시간
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {p.average_time_seconds ? `${p.average_time_seconds}초` : '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Error Patterns */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          자주 하는 실수
        </Typography>

        {errorPatterns.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            아직 오류 패턴이 기록되지 않았습니다.
          </Typography>
        ) : (
          <Grid container spacing={2} mt={1}>
            {errorPatterns.slice(0, 5).map((pattern, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">
                          {getProblemTypeLabel(pattern.problem_type)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getErrorTypeLabel(pattern.error_type)}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip
                          label={`${pattern.occurrences}회`}
                          color={pattern.is_resolved ? 'success' : 'error'}
                          variant={pattern.is_resolved ? 'outlined' : 'filled'}
                        />
                        {pattern.is_resolved && (
                          <Typography variant="caption" display="block" color="success.main">
                            해결됨
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default ProgressPage;
