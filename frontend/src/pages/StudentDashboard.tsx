import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

interface Solution {
  id: string
  problem_id: string
  module_id: string
  started_at: string
  completed_at: string | null
  is_correct: boolean | null
  time_spent_seconds: number
  attempts_count: number
  hints_used_count: number
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock student ID - in production, get from authentication
  const studentId = 'demo-student-123'

  useEffect(() => {
    const loadSolutions = async () => {
      try {
        // In production, fetch from API
        // const response = await fetch(`/api/v1/solutions/student/${studentId}/solutions`)
        // const data = await response.json()

        // Mock data for demonstration
        const mockSolutions: Solution[] = [
          {
            id: 'solution-1',
            problem_id: 'problem-1',
            module_id: 'module-1',
            started_at: new Date(Date.now() - 3600000).toISOString(),
            completed_at: new Date(Date.now() - 3000000).toISOString(),
            is_correct: true,
            time_spent_seconds: 120,
            attempts_count: 5,
            hints_used_count: 2,
          },
          {
            id: 'solution-2',
            problem_id: 'problem-2',
            module_id: 'module-1',
            started_at: new Date(Date.now() - 7200000).toISOString(),
            completed_at: new Date(Date.now() - 6000000).toISOString(),
            is_correct: false,
            time_spent_seconds: 180,
            attempts_count: 8,
            hints_used_count: 3,
          },
        ]

        setSolutions(mockSolutions)
      } catch (err: any) {
        setError(err.message || 'Failed to load solutions')
      } finally {
        setLoading(false)
      }
    }

    loadSolutions()
  }, [studentId])

  const viewFlowchart = (solutionId: string) => {
    navigate(`/flowchart/${solutionId}`)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        내 학습 현황
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        문제 풀이 과정을 시각적 흐름도로 확인하세요
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {solutions.map((solution) => (
          <Grid item xs={12} md={6} key={solution.id}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h2">
                    문제 #{solution.problem_id.slice(-6)}
                  </Typography>
                  {solution.is_correct !== null && (
                    <Chip
                      icon={solution.is_correct ? <CheckCircleIcon /> : <CancelIcon />}
                      label={solution.is_correct ? '정답' : '오답'}
                      color={solution.is_correct ? 'success' : 'error'}
                    />
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>시작:</strong> {new Date(solution.started_at).toLocaleString('ko-KR')}
                  </Typography>
                  {solution.completed_at && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>완료:</strong> {new Date(solution.completed_at).toLocaleString('ko-KR')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>소요 시간:</strong> {Math.floor(solution.time_spent_seconds / 60)}분 {solution.time_spent_seconds % 60}초
                  </Typography>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={`시도: ${solution.attempts_count}회`} size="small" variant="outlined" />
                  <Chip label={`힌트: ${solution.hints_used_count}회`} size="small" variant="outlined" />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  onClick={() => viewFlowchart(solution.id)}
                  fullWidth
                >
                  풀이 과정 보기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {solutions.length === 0 && !loading && (
        <Alert severity="info">
          아직 풀이한 문제가 없습니다. 문제를 풀어보세요!
        </Alert>
      )}
    </Container>
  )
}

export default StudentDashboard
