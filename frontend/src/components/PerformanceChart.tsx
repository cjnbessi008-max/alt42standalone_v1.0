/**
 * Performance Chart Component
 * Visualizes student performance across different problem types
 */
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Paper, Typography, Box } from '@mui/material'
import type { ProblemTypePerformance } from '../types'

interface PerformanceChartProps {
  data: ProblemTypePerformance[]
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.problem_type_name,
    정답률: item.accuracy_rate,
    숙련도: item.mastery_level,
  }))

  const getBarColor = (value: number) => {
    if (value >= 80) return '#4caf50' // Green
    if (value >= 60) return '#2196f3' // Blue
    if (value >= 40) return '#ff9800' // Orange
    return '#f44336' // Red
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        문제 유형별 성과
      </Typography>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="정답률" fill="#2196f3">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.정답률)} />
            ))}
          </Bar>
          <Bar dataKey="숙련도" fill="#4caf50">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.숙련도)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          * 정답률과 숙련도는 0-100 범위로 표시됩니다
        </Typography>
      </Box>
    </Paper>
  )
}

export default PerformanceChart
