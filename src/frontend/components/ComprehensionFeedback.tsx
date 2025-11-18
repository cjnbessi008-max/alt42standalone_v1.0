/**
 * ComprehensionFeedback Component
 *
 * Displays AI-generated comprehension summaries and feedback to students
 *
 * Features:
 * - Shows comprehension score with visual indicator
 * - Displays personalized AI feedback
 * - Provides actionable tips
 * - Shows trends over time
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  LinearProgress,
  Alert,
  Button,
  Chip,
  Grid,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ExpandMore,
  ExpandLess,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';

interface ComprehensionSummary {
  id: number;
  student_id: string;
  module_id: string;
  summary_period: string;
  total_problems_attempted: number;
  avg_reading_time_seconds: number;
  avg_reading_speed_wpm: number;
  avg_comprehension_score: number;
  first_attempt_success_rate: number;
  reading_speed_trend: 'improving' | 'declining' | 'stable';
  comprehension_trend: 'improving' | 'declining' | 'stable';
  ai_summary: string;
  ai_recommendations: string;
  ai_strengths: string;
  ai_challenges: string;
  student_message: string;
  student_tips: string;
  teacher_action_needed: boolean;
  created_at: string;
}

interface ComprehensionFeedbackProps {
  studentId: string;
  moduleId: string;
  autoLoad?: boolean;
  showDetailedFeedback?: boolean;
}

export const ComprehensionFeedback: React.FC<ComprehensionFeedbackProps> = ({
  studentId,
  moduleId,
  autoLoad = true,
  showDetailedFeedback = true,
}) => {
  const [summary, setSummary] = useState<ComprehensionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Load summary on mount
  useEffect(() => {
    if (autoLoad) {
      loadSummary();
    }
  }, [studentId, moduleId, autoLoad]);

  // Load existing summary
  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/comprehension-summary/${studentId}`,
        { params: { module_id: moduleId, limit: 1 } }
      );

      if (response.data && response.data.length > 0) {
        setSummary(response.data[0]);
      } else {
        setError('아직 생성된 요약이 없습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load summary:', err);
      setError('요약을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Generate new summary
  const generateSummary = async () => {
    setGenerating(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/comprehension-summary/generate`,
        {
          student_id: studentId,
          module_id: moduleId,
          summary_period: 'weekly',
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          force_regenerate: true,
        }
      );

      setSummary(response.data);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      if (err.response?.status === 404) {
        setError('아직 충분한 데이터가 없습니다. 문제를 더 풀어보세요!');
      } else {
        setError('요약 생성에 실패했습니다.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      case 'stable':
        return <TrendingFlat color="action" />;
    }
  };

  // Get score color
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !summary) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={generateSummary}>
            생성하기
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="text.secondary" gutterBottom>
          이해도 요약이 없습니다
        </Typography>
        <Button
          variant="contained"
          onClick={generateSummary}
          disabled={generating}
        >
          {generating ? '생성 중...' : '요약 생성하기'}
        </Button>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">나의 학습 요약</Typography>
          <Box>
            <IconButton size="small" onClick={generateSummary} disabled={generating}>
              <Refresh />
            </IconButton>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Score Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                이해도 점수
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                <CircularProgress
                  variant="determinate"
                  value={summary.avg_comprehension_score}
                  size={80}
                  color={getScoreColor(summary.avg_comprehension_score)}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div" color="text.secondary">
                    {Math.round(summary.avg_comprehension_score)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {getTrendIcon(summary.comprehension_trend)}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {summary.comprehension_trend === 'improving' && '향상 중'}
                  {summary.comprehension_trend === 'declining' && '주의 필요'}
                  {summary.comprehension_trend === 'stable' && '유지 중'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                읽기 속도
              </Typography>
              <Typography variant="h6">
                {Math.round(summary.avg_reading_speed_wpm)} WPM
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {getTrendIcon(summary.reading_speed_trend)}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {summary.reading_speed_trend === 'improving' && '빨라지고 있어요'}
                  {summary.reading_speed_trend === 'declining' && '느려지고 있어요'}
                  {summary.reading_speed_trend === 'stable' && '일정해요'}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                첫 시도 정답률
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={summary.first_attempt_success_rate}
                  sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 1 }}
                  color={getScoreColor(summary.first_attempt_success_rate)}
                />
                <Typography variant="body2">
                  {Math.round(summary.first_attempt_success_rate)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Student Message */}
        {summary.student_message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {summary.student_message}
            </Typography>
          </Alert>
        )}

        {/* Detailed Feedback */}
        <Collapse in={expanded && showDetailedFeedback}>
          <Box sx={{ mt: 2 }}>
            {/* Student Tips */}
            {summary.student_tips && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  💡 학습 팁
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', pl: 2 }}>
                  {summary.student_tips}
                </Typography>
              </Box>
            )}

            {/* Stats */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                최근 {summary.total_problems_attempted}개 문제 분석 결과
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    평균 읽기 시간
                  </Typography>
                  <Typography variant="body2">
                    {Math.floor(summary.avg_reading_time_seconds / 60)}분{' '}
                    {summary.avg_reading_time_seconds % 60}초
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    분석 기간
                  </Typography>
                  <Typography variant="body2">
                    {summary.summary_period === 'daily' && '오늘'}
                    {summary.summary_period === 'weekly' && '이번 주'}
                    {summary.summary_period === 'monthly' && '이번 달'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Collapse>

        {/* Teacher Alert (if needed) */}
        {summary.teacher_action_needed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            선생님께 추가 도움을 요청하는 것이 좋겠어요.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensionFeedback;
