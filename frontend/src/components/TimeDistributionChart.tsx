/**
 * Time Distribution Chart Component
 * Shows how time is distributed across different activity types
 */

import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { TimeDistribution } from '../../../shared/types';

interface TimeDistributionChartProps {
  timeDistribution: TimeDistribution;
}

export default function TimeDistributionChart({ timeDistribution }: TimeDistributionChartProps) {
  const data = [
    { name: '읽기', value: timeDistribution.reading, color: '#2196f3' },
    { name: '문제 풀이', value: timeDistribution.problemSolving, color: '#4caf50' },
    { name: '비디오 시청', value: timeDistribution.videoWatching, color: '#ff9800' },
    { name: '인터랙티브 연습', value: timeDistribution.interactiveExercise, color: '#9c27b0' },
    { name: '평가', value: timeDistribution.assessment, color: '#f44336' },
    { name: '성찰', value: timeDistribution.reflection, color: '#795548' }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          시간 분포
        </Typography>

        {data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              데이터가 충분하지 않습니다
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            💡 균형잡힌 학습을 위해 다양한 활동을 시도해보세요
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
