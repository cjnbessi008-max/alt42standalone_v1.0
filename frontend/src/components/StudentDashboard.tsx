/**
 * Student Dashboard Component
 * Main dashboard showing bottlenecks and performance for a student
 */
import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import BottleneckCard from './BottleneckCard'
import PerformanceChart from './PerformanceChart'
import { bottlenecksApi, performanceApi } from '../services/api'
import { BottleneckWebSocket } from '../services/websocket'
import type { WebSocketMessage } from '../types'

interface StudentDashboardProps {
  studentId: string
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  const queryClient = useQueryClient()
  const [wsMessage, setWsMessage] = useState<WebSocketMessage | null>(null)

  // Fetch bottlenecks
  const {
    data: bottlenecks,
    isLoading: bottlenecksLoading,
    error: bottlenecksError,
  } = useQuery({
    queryKey: ['bottlenecks', studentId],
    queryFn: () => bottlenecksApi.getForStudent(studentId, true),
    refetchInterval: 60000, // Refetch every minute
  })

  // Fetch performance summary
  const {
    data: performance,
    isLoading: performanceLoading,
    error: performanceError,
  } = useQuery({
    queryKey: ['performance', studentId],
    queryFn: () => performanceApi.getSummary(studentId),
    refetchInterval: 60000,
  })

  // Analyze bottlenecks mutation
  const analyzeBottlenecks = useMutation({
    mutationFn: () => bottlenecksApi.analyze(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bottlenecks', studentId] })
    },
  })

  // Resolve bottleneck mutation
  const resolveBottleneck = useMutation({
    mutationFn: (bottleneckId: string) =>
      bottlenecksApi.resolve(studentId, bottleneckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bottlenecks', studentId] })
    },
  })

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new BottleneckWebSocket(studentId)

    ws.onMessage((message) => {
      console.log('WebSocket message:', message)
      setWsMessage(message)

      if (message.type === 'bottleneck_detected') {
        // Refetch bottlenecks when a new one is detected
        queryClient.invalidateQueries({ queryKey: ['bottlenecks', studentId] })
      }
    })

    ws.connect()

    return () => {
      ws.disconnect()
    }
  }, [studentId, queryClient])

  if (bottlenecksLoading || performanceLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (bottlenecksError || performanceError) {
    return (
      <Alert severity="error">
        데이터를 불러오는 중 오류가 발생했습니다.
      </Alert>
    )
  }

  const activeBottlenecks = bottlenecks?.filter((b) => b.is_active) || []
  const criticalBottlenecks = activeBottlenecks.filter((b) => b.severity === 'critical')

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Real-time notification */}
      {wsMessage?.type === 'bottleneck_detected' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          새로운 병목 지점이 발견되었습니다!
        </Alert>
      )}

      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          학습 병목 지점 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          실시간으로 어려움을 겪는 문제 유형을 확인하고 개선하세요
        </Typography>
      </Box>

      {/* Summary Cards */}
      {performance && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                전체 정답률
              </Typography>
              <Typography variant="h4" color={performance.overall.accuracy_rate >= 70 ? 'success.main' : 'error.main'}>
                {performance.overall.accuracy_rate.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                총 시도 횟수
              </Typography>
              <Typography variant="h4">
                {performance.overall.total_attempts}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                활성 병목 지점
              </Typography>
              <Typography variant="h4" color={activeBottlenecks.length > 0 ? 'warning.main' : 'success.main'}>
                {activeBottlenecks.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                심각한 병목
              </Typography>
              <Typography variant="h4" color={criticalBottlenecks.length > 0 ? 'error.main' : 'success.main'}>
                {criticalBottlenecks.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Actions */}
      <Box mb={3}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => analyzeBottlenecks.mutate()}
          disabled={analyzeBottlenecks.isPending}
        >
          {analyzeBottlenecks.isPending ? '분석 중...' : '병목 지점 분석'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Bottlenecks Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            병목 지점 ({activeBottlenecks.length})
          </Typography>

          {activeBottlenecks.length === 0 ? (
            <Alert severity="success">
              현재 발견된 병목 지점이 없습니다. 잘하고 있어요!
            </Alert>
          ) : (
            activeBottlenecks.map((bottleneck) => (
              <BottleneckCard
                key={bottleneck.id}
                bottleneck={bottleneck}
                onResolve={(id) => resolveBottleneck.mutate(id)}
              />
            ))
          )}
        </Grid>

        {/* Performance Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            성과 분석
          </Typography>

          {performance && performance.by_problem_type.length > 0 ? (
            <>
              <PerformanceChart data={performance.by_problem_type} />

              <Box mt={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    강점 영역
                  </Typography>
                  {performance.strongest_types.slice(0, 3).map((type) => (
                    <Box key={type.problem_type_id} mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUpIcon color="success" />
                        <Typography variant="body1">
                          {type.problem_type_name}
                        </Typography>
                        <Chip
                          label={`숙련도: ${type.mastery_level}%`}
                          size="small"
                          color="success"
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box mt={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    개선 필요 영역
                  </Typography>
                  {performance.weakest_types.slice(0, 3).map((type) => (
                    <Box key={type.problem_type_id} mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingDownIcon color="error" />
                        <Typography variant="body1">
                          {type.problem_type_name}
                        </Typography>
                        <Chip
                          label={`숙련도: ${type.mastery_level}%`}
                          size="small"
                          color="error"
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              아직 성과 데이터가 충분하지 않습니다. 더 많은 문제를 풀어보세요!
            </Alert>
          )}
        </Grid>
      </Grid>
    </Container>
  )
}

export default StudentDashboard
