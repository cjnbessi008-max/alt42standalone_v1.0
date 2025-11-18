import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FocusData } from '@/types';
import { format } from 'date-fns';

interface FocusChartProps {
  data: FocusData[];
  className?: string;
  height?: number;
}

export const FocusChart: React.FC<FocusChartProps> = ({
  data,
  className = '',
  height = 300,
}) => {
  // 차트 데이터 변환
  const chartData = data.map((item) => ({
    time: format(new Date(item.timestamp), 'HH:mm:ss'),
    timestamp: item.timestamp,
    score: Math.round(item.score),
  }));

  // 최근 100개 데이터만 표시
  const displayData = chartData.slice(-100);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-sm text-gray-600">{data.time}</p>
          <p className="text-lg font-bold" style={{ color: getScoreColor(data.score) }}>
            집중도: {data.score}점
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">실시간 집중도 추이</h3>

      {displayData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          데이터를 수집하는 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 기준선 */}
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" label="높은 집중" />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label="중간 집중" />

            {/* 집중도 라인 */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* 범례 */}
      <div className="flex justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">높은 집중 (70+)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
          <span className="text-gray-600">중간 집중 (40-70)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-600">낮은 집중 (40 미만)</span>
        </div>
      </div>
    </div>
  );
};

const getScoreColor = (score: number): string => {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};
