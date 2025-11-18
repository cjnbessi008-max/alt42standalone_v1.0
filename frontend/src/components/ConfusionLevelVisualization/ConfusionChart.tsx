/**
 * Confusion Chart Component
 *
 * Displays a time-series chart of confusion levels over time
 */

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
  Area,
  AreaChart,
} from 'recharts';
import { ConfusionDataPoint, ConfusionCategory } from '../../types/confusion';
import { format } from 'date-fns';

interface ConfusionChartProps {
  data: ConfusionDataPoint[];
  variant?: 'line' | 'area';
  height?: number;
  showGrid?: boolean;
  className?: string;
}

const ConfusionChart: React.FC<ConfusionChartProps> = ({
  data,
  variant = 'area',
  height = 300,
  showGrid = true,
  className = '',
}) => {
  if (data.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <p>아직 데이터가 없습니다</p>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map((point) => ({
    timestamp: format(new Date(point.timestamp), 'HH:mm:ss'),
    fullTimestamp: point.timestamp,
    혼란도: point.confusionLevel,
    category: point.category,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-semibold">
            {format(new Date(data.fullTimestamp), 'yyyy-MM-dd HH:mm:ss')}
          </p>
          <p className="text-sm text-gray-700">혼란도: {data.혼란도}%</p>
          <p className="text-xs text-gray-500">{getCategoryLabel(data.category)}</p>
        </div>
      );
    }
    return null;
  };

  const getCategoryLabel = (category: ConfusionCategory): string => {
    const labels: Record<ConfusionCategory, string> = {
      [ConfusionCategory.VERY_LOW]: '매우 낮음',
      [ConfusionCategory.LOW]: '낮음',
      [ConfusionCategory.MEDIUM]: '보통',
      [ConfusionCategory.HIGH]: '높음',
      [ConfusionCategory.VERY_HIGH]: '매우 높음',
    };
    return labels[category];
  };

  if (variant === 'line') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="timestamp" style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="혼란도"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Area chart variant
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="timestamp" style={{ fontSize: '12px' }} />
          <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="confusionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#eab308" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="혼란도"
            stroke="#8884d8"
            strokeWidth={2}
            fill="url(#confusionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConfusionChart;
