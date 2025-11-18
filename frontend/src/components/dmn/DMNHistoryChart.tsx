/**
 * DMN History Chart Component
 * Visualizes DMN status over time
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DMNStatusData, DMN_COLORS, DMNStatus } from '../../types/dmn.types';
import { format } from 'date-fns';

interface DMNHistoryChartProps {
  history: DMNStatusData[];
  language?: 'ko' | 'en';
}

export const DMNHistoryChart: React.FC<DMNHistoryChartProps> = ({
  history,
  language = 'ko',
}) => {
  // Convert history to chart data
  const chartData = history.map((item) => ({
    time: format(new Date(item.recorded_at), 'HH:mm:ss'),
    timestamp: new Date(item.recorded_at).getTime(),
    engagement: item.metadata?.engagement_score || 0,
    confidence: item.confidence_score,
    status: item.status,
  }));

  // Calculate status durations for pie chart data
  const statusCounts = history.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<DMNStatus, number>);

  const total = history.length;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {language === 'ko' ? 'DMN 상태 이력' : 'DMN Status History'}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
              label={{
                value: language === 'ko' ? '참여도' : 'Engagement',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              formatter={(value: number) => `${Math.round(value * 100)}%`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke={DMN_COLORS[DMNStatus.ACTIVE_LEARNING]}
              fill={DMN_COLORS[DMNStatus.ACTIVE_LEARNING]}
              fillOpacity={0.6}
              name={language === 'ko' ? '참여도' : 'Engagement'}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#FF9800"
              strokeWidth={2}
              dot={false}
              name={language === 'ko' ? '신뢰도' : 'Confidence'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Status distribution */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Box
            key={status}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: DMN_COLORS[status as DMNStatus],
              }}
            />
            <Typography variant="body2">
              {language === 'ko' ? '깊은 집중' : status.replace('_', ' ')}: {Math.round((count / total) * 100)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
