import { Grid, Paper, Typography, Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { correlationApi } from '../services/api'

export default function Dashboard() {
  const { data: analyses } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => correlationApi.listAnalyses({ limit: 5 }),
  })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              총 분석 횟수
            </Typography>
            <Typography variant="h3">
              {analyses?.data?.length || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              최근 분석
            </Typography>
            <Typography variant="h3">
              {analyses?.data?.[0]?.analysis_name || '-'}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              최근 상관관계 분석 결과
            </Typography>
            {analyses?.data && analyses.data.length > 0 ? (
              <Box>
                {analyses.data.map((analysis: any) => (
                  <Box key={analysis.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {analysis.analysis_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      분석 유형: {analysis.analysis_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      상관계수: {analysis.correlation_coefficient.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      유의미: {analysis.is_significant ? '예' : '아니오'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      효과 크기: {analysis.effect_size}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">
                분석 결과가 없습니다. 상관관계 분석 페이지에서 새로운 분석을 시작하세요.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
