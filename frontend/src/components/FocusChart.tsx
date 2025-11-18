/**
 * Focus Chart Component
 * Displays focus scores over time
 */
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sessionsApi } from '../services/api';
import type { FocusSession } from '../types';
import { format } from 'date-fns';

export const FocusChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const response = await sessionsApi.getAll(0, 30);
      const sessions: FocusSession[] = response.data;

      // Transform data for chart
      const chartData = sessions
        .filter(s => s.average_focus_score !== null)
        .map(s => ({
          date: format(new Date(s.session_start), 'MM/dd'),
          focusScore: Math.round(s.average_focus_score || 0),
          engagementScore: Math.round(s.engagement_score || 0),
        }))
        .reverse(); // Most recent first

      setData(chartData);
    } catch (err) {
      console.error('Error loading chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div>No session data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="focusScore"
          stroke="#2196f3"
          name="Focus Score"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="engagementScore"
          stroke="#4caf50"
          name="Engagement Score"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
