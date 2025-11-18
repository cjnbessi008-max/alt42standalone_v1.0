import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '../services/api';
import type { Trend } from '../types';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  studentId: string;
  days?: number;
}

export default function TrendChart({ studentId, days = 7 }: TrendChartProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, [studentId, days]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getTrends(studentId, days);
      setTrends(data);
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return null;
  }

  // 날짜 포맷팅
  const formattedTrends = trends.map(trend => ({
    ...trend,
    dateLabel: new Date(trend.date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} />
          학습 추세 (최근 {days}일)
        </h2>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
          정답률 추이
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={formattedTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracyRate"
              stroke="#10b981"
              strokeWidth={2}
              name="정답률 (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
          문제 풀이 개수
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={formattedTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalProblems" fill="#3b82f6" name="총 문제" />
            <Bar dataKey="correctCount" fill="#10b981" name="정답" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
