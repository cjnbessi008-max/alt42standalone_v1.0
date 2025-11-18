import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
} from 'recharts'
import { Box, Typography } from '@mui/material'

interface DataPoint {
  x: number
  y: number
  student_id?: number
}

interface TrendPoint {
  x: number
  y: number
}

interface CorrelationChartProps {
  data: {
    scatter_data: DataPoint[]
    trend_line: TrendPoint[]
    correlation_coefficient: number
    is_significant: boolean
  }
}

export default function CorrelationChart({ data }: CorrelationChartProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom textAlign="center">
        추론 밀도 vs 정답률 산점도
      </Typography>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="추론 밀도"
            label={{ value: '추론 밀도 점수', position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="정답률"
            label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>추론 밀도:</strong> {data.x.toFixed(2)}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>정답률:</strong> {data.y.toFixed(2)}%
                    </p>
                    {data.student_id && (
                      <p style={{ margin: 0 }}>
                        <strong>학생 ID:</strong> {data.student_id}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Scatter
            name="데이터 포인트"
            data={data.scatter_data}
            fill="#8884d8"
          />
          <Scatter
            name="추세선"
            data={data.trend_line}
            fill="none"
            line
            stroke="#ff7300"
            strokeWidth={2}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>해석:</strong>{' '}
          {data.correlation_coefficient > 0.7
            ? '강한 양의 상관관계가 있습니다. 추론 밀도가 높을수록 정답률이 높습니다.'
            : data.correlation_coefficient > 0.4
            ? '중간 정도의 양의 상관관계가 있습니다.'
            : data.correlation_coefficient > 0.1
            ? '약한 양의 상관관계가 있습니다.'
            : data.correlation_coefficient > -0.1
            ? '상관관계가 거의 없습니다.'
            : '음의 상관관계가 있습니다.'}
          {' '}
          {data.is_significant
            ? '이 결과는 통계적으로 유의미합니다.'
            : '이 결과는 통계적으로 유의미하지 않을 수 있습니다.'}
        </Typography>
      </Box>
    </Box>
  )
}
