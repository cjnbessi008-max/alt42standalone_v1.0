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
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { ConsistencyScore } from '../types';
import { format } from 'date-fns';

interface ScoreTrendChartProps {
  scores: ConsistencyScore[];
  title?: string;
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  scores,
  title = '꾸준함 점수 추이',
}) => {
  const chartData = scores.map((score) => ({
    date: format(new Date(score.date), 'MM/dd'),
    총점: score.total_score,
    출석: score.attendance_score,
    활동: score.activity_score,
    과제: score.submission_score,
  }));

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="총점"
              stroke="#1976d2"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
            <Line type="monotone" dataKey="출석" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="활동" stroke="#ffc658" strokeWidth={2} />
            <Line type="monotone" dataKey="과제" stroke="#ff7c7c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
