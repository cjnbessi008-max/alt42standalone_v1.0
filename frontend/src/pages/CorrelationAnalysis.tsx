import { useState } from 'react'
import {
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { correlationApi } from '../services/api'
import CorrelationChart from '../components/correlation/CorrelationChart'
import AnalysisIcon from '@mui/icons-material/Analytics'

export default function CorrelationAnalysis() {
  const [analysisType, setAnalysisType] = useState('pearson')
  const [analysisName, setAnalysisName] = useState('')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: correlationApi.analyze,
    onSuccess: (response) => {
      setCurrentAnalysisId(response.data.analysis_id)
    },
  })

  const { data: vizData, isLoading: vizLoading } = useQuery({
    queryKey: ['visualization', currentAnalysisId],
    queryFn: () => correlationApi.getVisualization(currentAnalysisId!),
    enabled: !!currentAnalysisId,
  })

  const handleAnalyze = () => {
    analyzeMutation.mutate({
      analysis_name: analysisName || undefined,
      analysis_type: analysisType,
    })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        정답률-추론 밀도 상관관계 분석
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          분석 설정
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="분석 이름"
            value={analysisName}
            onChange={(e) => setAnalysisName(e.target.value)}
            fullWidth
            placeholder="예: 2024년 1학기 수학 상관분석"
          />

          <FormControl fullWidth>
            <InputLabel>분석 유형</InputLabel>
            <Select
              value={analysisType}
              label="분석 유형"
              onChange={(e) => setAnalysisType(e.target.value)}
            >
              <MenuItem value="pearson">Pearson 상관계수 (선형 관계)</MenuItem>
              <MenuItem value="spearman">Spearman 상관계수 (단조 관계)</MenuItem>
              <MenuItem value="kendall">Kendall 타우 (순위 기반)</MenuItem>
              <MenuItem value="linear_regression">선형 회귀 분석</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AnalysisIcon />}
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            size="large"
          >
            {analyzeMutation.isPending ? '분석 중...' : '분석 시작'}
          </Button>

          {analyzeMutation.isError && (
            <Alert severity="error">
              분석에 실패했습니다. 데이터가 충분한지 확인해주세요.
            </Alert>
          )}

          {analyzeMutation.isSuccess && (
            <Alert severity="success">
              분석이 완료되었습니다!
            </Alert>
          )}
        </Box>
      </Paper>

      {currentAnalysisId && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            분석 결과
          </Typography>

          {vizLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : vizData?.data ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1">
                  <strong>상관계수:</strong> {vizData.data.correlation_coefficient.toFixed(4)}
                </Typography>
                <Typography variant="body1">
                  <strong>p-value:</strong> {vizData.data.p_value.toFixed(6)}
                </Typography>
                <Typography variant="body1">
                  <strong>통계적 유의미:</strong> {vizData.data.is_significant ? '예' : '아니오'}
                </Typography>
                <Typography variant="body1">
                  <strong>샘플 크기:</strong> {vizData.data.sample_size}
                </Typography>
              </Box>

              <CorrelationChart data={vizData.data} />
            </Box>
          ) : null}
        </Paper>
      )}
    </Box>
  )
}
