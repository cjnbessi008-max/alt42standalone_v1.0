/**
 * Bottleneck Card Component
 * Displays a single bottleneck detection with details and recommendations
 */
import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import type { Bottleneck } from '../types'

interface BottleneckCardProps {
  bottleneck: Bottleneck
  onResolve?: (bottleneckId: string) => void
}

const BottleneckCard: React.FC<BottleneckCardProps> = ({
  bottleneck,
  onResolve,
}) => {
  const getSeverityColor = (
    severity: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon />
      case 'high':
        return <WarningIcon />
      case 'medium':
        return <InfoIcon />
      case 'low':
        return <CheckIcon />
      default:
        return <InfoIcon />
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '매우 심각'
      case 'high':
        return '심각'
      case 'medium':
        return '보통'
      case 'low':
        return '경미'
      default:
        return severity
    }
  }

  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: `4px solid ${
          getSeverityColor(bottleneck.severity) === 'error'
            ? '#f44336'
            : getSeverityColor(bottleneck.severity) === 'warning'
            ? '#ff9800'
            : getSeverityColor(bottleneck.severity) === 'info'
            ? '#2196f3'
            : '#4caf50'
        }`,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getSeverityIcon(bottleneck.severity)}
            <Typography variant="h6">{bottleneck.problem_type_name}</Typography>
          </Box>
          <Chip
            label={getSeverityText(bottleneck.severity)}
            color={getSeverityColor(bottleneck.severity)}
            size="small"
          />
        </Box>

        <Typography color="text.secondary" gutterBottom>
          카테고리: {bottleneck.category}
        </Typography>

        <Alert severity="warning" sx={{ my: 2 }}>
          {bottleneck.detection_reason}
        </Alert>

        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} my={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              정답률
            </Typography>
            <Typography variant="h6" color={bottleneck.accuracy_rate < 60 ? 'error' : 'success'}>
              {bottleneck.accuracy_rate.toFixed(1)}%
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              난이도 점수
            </Typography>
            <Typography variant="h6" color={bottleneck.difficulty_score >= 80 ? 'error' : 'warning'}>
              {bottleneck.difficulty_score.toFixed(1)}점
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              평균 해결 시간
            </Typography>
            <Typography variant="h6">
              {Math.floor(bottleneck.avg_solve_time_seconds / 60)}분{' '}
              {bottleneck.avg_solve_time_seconds % 60}초
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              발견 시간
            </Typography>
            <Typography variant="body2">
              {new Date(bottleneck.detected_at).toLocaleString('ko-KR')}
            </Typography>
          </Box>
        </Box>

        {bottleneck.recommended_actions && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              개선 방안
            </Typography>

            {bottleneck.recommended_actions.focus_areas.length > 0 && (
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  집중 영역:
                </Typography>
                <List dense>
                  {bottleneck.recommended_actions.focus_areas.map((area, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`• ${area}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {bottleneck.recommended_actions.practice_strategy && (
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  학습 전략:
                </Typography>
                <Typography variant="body2">
                  {bottleneck.recommended_actions.practice_strategy}
                </Typography>
              </Box>
            )}

            {bottleneck.recommended_actions.suggested_resources.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  추천 자료:
                </Typography>
                <List dense>
                  {bottleneck.recommended_actions.suggested_resources.map((resource, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`• ${resource}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {bottleneck.is_active && onResolve && (
          <Box mt={2}>
            <Button
              variant="outlined"
              color="success"
              onClick={() => onResolve(bottleneck.id)}
            >
              해결됨으로 표시
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default BottleneckCard
