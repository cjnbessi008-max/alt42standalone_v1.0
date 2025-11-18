import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'

interface StudentSolution {
  student_name: string
  student_id: string
  solution_id: string
  problem_id: string
  completed_at: string | null
  is_correct: boolean | null
  time_spent_seconds: number
  attempts_count: number
  hints_used_count: number
}

const TeacherDashboard = () => {
  const navigate = useNavigate()
  const [solutions, setSolutions] = useState<StudentSolution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSolutions = async () => {
      try {
        // Mock data for demonstration
        const mockSolutions: StudentSolution[] = [
          {
            student_name: '김학생',
            student_id: 'student-1',
            solution_id: 'solution-1',
            problem_id: 'problem-1',
            completed_at: new Date(Date.now() - 3000000).toISOString(),
            is_correct: true,
            time_spent_seconds: 120,
            attempts_count: 5,
            hints_used_count: 2,
          },
          {
            student_name: '이학생',
            student_id: 'student-2',
            solution_id: 'solution-2',
            problem_id: 'problem-1',
            completed_at: new Date(Date.now() - 6000000).toISOString(),
            is_correct: false,
            time_spent_seconds: 180,
            attempts_count: 8,
            hints_used_count: 3,
          },
          {
            student_name: '박학생',
            student_id: 'student-3',
            solution_id: 'solution-3',
            problem_id: 'problem-2',
            completed_at: new Date(Date.now() - 9000000).toISOString(),
            is_correct: true,
            time_spent_seconds: 90,
            attempts_count: 3,
            hints_used_count: 1,
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
  }, [])

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
        교사 대시보드
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        학생들의 문제 풀이 과정을 확인하고 분석하세요
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>학생 이름</strong></TableCell>
              <TableCell><strong>문제 ID</strong></TableCell>
              <TableCell><strong>결과</strong></TableCell>
              <TableCell align="right"><strong>소요 시간</strong></TableCell>
              <TableCell align="right"><strong>시도 횟수</strong></TableCell>
              <TableCell align="right"><strong>힌트 사용</strong></TableCell>
              <TableCell><strong>완료 시간</strong></TableCell>
              <TableCell align="center"><strong>액션</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solutions.map((solution) => (
              <TableRow key={solution.solution_id} hover>
                <TableCell>{solution.student_name}</TableCell>
                <TableCell>#{solution.problem_id.slice(-6)}</TableCell>
                <TableCell>
                  {solution.is_correct !== null && (
                    <Chip
                      label={solution.is_correct ? '정답' : '오답'}
                      color={solution.is_correct ? 'success' : 'error'}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {Math.floor(solution.time_spent_seconds / 60)}분 {solution.time_spent_seconds % 60}초
                </TableCell>
                <TableCell align="right">{solution.attempts_count}회</TableCell>
                <TableCell align="right">{solution.hints_used_count}회</TableCell>
                <TableCell>
                  {solution.completed_at
                    ? new Date(solution.completed_at).toLocaleString('ko-KR')
                    : '-'}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => viewFlowchart(solution.solution_id)}
                  >
                    흐름도 보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {solutions.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          아직 학생 풀이 데이터가 없습니다.
        </Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          통계
        </Typography>
        <Box display="flex" gap={2}>
          <Paper elevation={2} sx={{ p: 2, flex: 1 }}>
            <Typography variant="h4" color="primary">
              {solutions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 풀이 수
            </Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, flex: 1 }}>
            <Typography variant="h4" color="success.main">
              {solutions.filter((s) => s.is_correct).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              정답 수
            </Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, flex: 1 }}>
            <Typography variant="h4" color="info.main">
              {Math.round(
                solutions.reduce((sum, s) => sum + s.time_spent_seconds, 0) / solutions.length || 0
              )}초
            </Typography>
            <Typography variant="body2" color="text.secondary">
              평균 소요 시간
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  )
}

export default TeacherDashboard
