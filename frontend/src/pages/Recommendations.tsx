import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Divider,
  LinearProgress,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import WarningIcon from '@mui/icons-material/Warning'
import { getMyRecommendations, getMyLearningPath, getDashboardInsights } from '../services/api'

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState<any>(null)
  const [learningPath, setLearningPath] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const [recData, pathData, insightsData] = await Promise.all([
        getMyRecommendations(),
        getMyLearningPath(),
        getDashboardInsights(),
      ])

      setRecommendations(recData)
      setLearningPath(pathData)
      setInsights(insightsData)
    } catch (err: any) {
      setError(err.message || '추천 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  const analysis = recommendations?.pattern_analysis || insights?.learning_analysis || {}

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        AI 맞춤형 학습 추천
      </Typography>

      {/* Learning Analysis Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">정확도</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analysis.accuracy_rate || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analysis.accuracy_rate || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">학습 속도</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {analysis.learning_pace || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analysis.avg_time_per_problem
                  ? `평균 ${Math.round(analysis.avg_time_per_problem)}초`
                  : '데이터 없음'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AutoAwesomeIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">문제 풀이 스타일</Typography>
              </Box>
              <Typography variant="body1" color="info.main">
                {analysis.problem_solving_style || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">시도 횟수</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {analysis.avg_attempts_per_problem
                  ? Math.round(analysis.avg_attempts_per_problem)
                  : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                평균
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strengths and Weaknesses */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="success.main">
              강점
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {analysis.strengths && analysis.strengths.length > 0 ? (
                analysis.strengths.map((strength: string, index: number) => (
                  <Chip key={index} label={strength} color="success" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  더 많은 문제를 풀어보세요!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="warning.main">
              개선 영역
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                analysis.weaknesses.map((weakness: string, index: number) => (
                  <Chip key={index} label={weakness} color="warning" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  잘 하고 있어요!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Recommendations */}
      {recommendations?.ai_recommendations && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <AutoAwesomeIcon sx={{ mr: 1, color: '#9c27b0' }} />
            <Typography variant="h5" color="primary">
              AI 추천 사항
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}
          >
            {recommendations.ai_recommendations}
          </Typography>
        </Paper>
      )}

      {/* Rule-based Recommendations */}
      {recommendations?.recommendations && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            추천 학습 전략
          </Typography>
          <Grid container spacing={2}>
            {recommendations.recommendations.map((rec: any, index: number) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Chip label={rec.type} size="small" color="primary" sx={{ mb: 1 }} />
                    <Typography variant="body1">{rec.suggestion}</Typography>
                    {rec.difficulty && (
                      <Chip
                        label={`난이도: ${rec.difficulty}`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Learning Path */}
      {learningPath?.learning_path && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            맞춤형 학습 경로
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {typeof learningPath.learning_path === 'string' ? (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {learningPath.learning_path}
            </Typography>
          ) : (
            <Box>
              {learningPath.learning_path.steps?.map((step: any, index: number) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      단계 {step.step}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      목표: {step.goal}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip label={`난이도: ${step.difficulty}`} size="small" />
                      <Chip label={`문제 수: ${step.problem_count}`} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {learningPath.learning_path.estimated_duration && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  예상 소요 시간: {learningPath.learning_path.estimated_duration}
                </Alert>
              )}
            </Box>
          )}

          <Box mt={3} display="flex" justifyContent="center">
            <Button variant="contained" size="large">
              학습 시작하기
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  )
}

export default Recommendations
