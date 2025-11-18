import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';
import { TimelineEvent } from '../../types/timeline';
import { formatTime, formatDuration } from '../../utils/formatters';

interface TimelineChartProps {
  events: TimelineEvent[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ events }) => {
  // Filter only attempt events and prepare data for the chart
  const attemptEvents = events.filter(e => e.event_type === 'attempt');

  const chartData = attemptEvents.map((event, index) => ({
    index: index + 1,
    timestamp: formatTime(event.timestamp),
    timeSpent: event.time_spent_seconds || 0,
    accuracy: event.is_correct ? 100 : 0,
    problemTitle: event.problem_title,
    difficulty: event.difficulty_level,
  }));

  // Calculate cumulative accuracy
  let correctCount = 0;
  const cumulativeData = chartData.map((data, index) => {
    if (data.accuracy === 100) correctCount++;
    return {
      ...data,
      cumulativeAccuracy: ((correctCount / (index + 1)) * 100).toFixed(1),
    };
  });

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          📈 학습 진행 차트
        </Typography>

        {/* Time Spent Chart */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
          문제별 풀이 시간
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              label={{ value: '시도 순서', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: '시간 (초)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'timeSpent') return [formatDuration(value), '풀이 시간'];
                return [value, name];
              }}
              labelFormatter={(label) => `${label}번째 시도`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="timeSpent"
              stroke="#8884d8"
              name="풀이 시간"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Cumulative Accuracy Chart */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 4, mb: 2 }}>
          누적 정답률 추이
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              label={{ value: '시도 순서', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, '누적 정답률']}
              labelFormatter={(label) => `${label}번째 시도`}
            />
            <Legend />
            <ReferenceLine y={80} stroke="green" strokeDasharray="3 3" label="목표 (80%)" />
            <Line
              type="monotone"
              dataKey="cumulativeAccuracy"
              stroke="#82ca9d"
              name="누적 정답률"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
