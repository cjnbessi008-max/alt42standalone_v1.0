import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { useMutation } from 'react-query'
import { analyzeProblem, fetchFromMoodle } from '../services/api'
import { useProblemStore } from '../store/problemStore'

export default function ControlPanel() {
  const [moodleId, setMoodleId] = useState('')
  const [directInput, setDirectInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const setProblemData = useProblemStore(state => state.setProblemData)

  const analyzeMutation = useMutation(analyzeProblem, {
    onSuccess: (data) => {
      setProblemData(data)
      setError(null)
      setDirectInput('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '분석 중 오류가 발생했습니다')
    },
  })

  const moodleMutation = useMutation(fetchFromMoodle, {
    onSuccess: (data) => {
      setProblemData(data)
      setError(null)
      setMoodleId('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Moodle에서 문제를 불러오는데 실패했습니다')
    },
  })

  const handleAnalyzeDirect = () => {
    if (!directInput.trim()) {
      setError('문제를 입력해주세요')
      return
    }
    analyzeMutation.mutate({ problem_text: directInput, use_ai: true })
  }

  const handleFetchFromMoodle = () => {
    const id = parseInt(moodleId)
    if (!id || id <= 0) {
      setError('유효한 문제 ID를 입력해주세요')
      return
    }
    moodleMutation.mutate({ question_id: id })
  }

  const isLoading = analyzeMutation.isLoading || moodleMutation.isLoading

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 3,
        background: 'white',
      }}
    >
      <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
        문제 불러오기
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Moodle Input */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          Moodle 문제 ID:
        </Typography>
        <TextField
          type="number"
          fullWidth
          placeholder="예: 12345"
          value={moodleId}
          onChange={(e) => setMoodleId(e.target.value)}
          disabled={isLoading}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleFetchFromMoodle}
          disabled={isLoading}
        >
          {moodleMutation.isLoading ? <CircularProgress size={24} /> : '불러오기'}
        </Button>
      </Box>

      {/* Direct Input */}
      <Box>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          또는 직접 입력:
        </Typography>
        <TextField
          multiline
          rows={4}
          fullWidth
          placeholder="미분 문제를 입력하세요 (LaTeX 지원)&#10;예: f(x) = x^3 + sin(2x) + x*ln(x)"
          value={directInput}
          onChange={(e) => setDirectInput(e.target.value)}
          disabled={isLoading}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleAnalyzeDirect}
          disabled={isLoading}
        >
          {analyzeMutation.isLoading ? <CircularProgress size={24} /> : '분석하기'}
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            AI가 문제를 분석하고 있습니다...
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
