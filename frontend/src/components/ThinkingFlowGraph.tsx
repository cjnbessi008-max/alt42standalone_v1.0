/**
 * Thinking Flow Graph Component
 * Visualizes student's thinking patterns, delays, and problem-solving flow
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
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { ThinkingFlowGraphData, DelaySegment } from '../types';

interface ThinkingFlowGraphProps {
  data: ThinkingFlowGraphData;
}

const SEGMENT_COLORS: Record<string, string> = {
  pause: '#FFA500',
  struggle: '#FF4444',
  exploration: '#4169E1',
  verification: '#32CD32',
};

const ThinkingFlowGraph: React.FC<ThinkingFlowGraphProps> = ({ data }) => {
  // Prepare timeline data for visualization
  const timelineData = React.useMemo(() => {
    const points: Array<{
      time: number;
      activity: number;
      label: string;
    }> = [];

    // Create activity level over time
    let currentTime = 0;
    const timeWindow = 1000; // 1 second windows

    while (currentTime <= (data.timeline[data.timeline.length - 1]?.time_ms || 0)) {
      const eventsInWindow = data.timeline.filter(
        (e) => e.time_ms >= currentTime && e.time_ms < currentTime + timeWindow
      );

      points.push({
        time: currentTime / 1000, // Convert to seconds for display
        activity: eventsInWindow.length,
        label: `${(currentTime / 1000).toFixed(1)}s`,
      });

      currentTime += timeWindow;
    }

    return points;
  }, [data.timeline]);

  // Prepare metrics data
  const metricsData = [
    {
      metric: '인지부하',
      score: data.thinking_metrics.cognitive_load,
      color: '#8884d8',
    },
    {
      metric: '끈기',
      score: data.thinking_metrics.persistence,
      color: '#82ca9d',
    },
    {
      metric: '효율성',
      score: data.thinking_metrics.efficiency,
      color: '#ffc658',
    },
  ];

  // Format time in ms to readable format
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="thinking-flow-graph" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>사고 흐름 분석</h2>

      {/* Metrics Overview */}
      <div style={{ marginBottom: '30px' }}>
        <h3>학습 지표</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metricsData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="metric" width={100} />
            <Tooltip />
            <Bar dataKey="score" label={{ position: 'right' }}>
              {metricsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Timeline */}
      <div style={{ marginBottom: '30px' }}>
        <h3>활동 타임라인</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: '활동 빈도', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        border: '1px solid #ccc',
                      }}
                    >
                      <p>{`시간: ${payload[0].payload.label}`}</p>
                      <p>{`활동: ${payload[0].value}회`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="activity"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              name="활동 빈도"
            />

            {/* Mark delay segments */}
            {data.delay_segments.map((segment, idx) => (
              <ReferenceLine
                key={idx}
                x={segment.start_time_ms / 1000}
                stroke={SEGMENT_COLORS[segment.segment_type]}
                strokeWidth={2}
                label={{
                  value: segment.segment_type,
                  position: 'top',
                  fontSize: 10,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delay Segments */}
      <div style={{ marginBottom: '30px' }}>
        <h3>지연 구간 분석</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          {Object.entries(SEGMENT_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: color,
                  borderRadius: '3px',
                }}
              />
              <span style={{ fontSize: '14px' }}>{type}</span>
            </div>
          ))}
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  유형
                </th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  시작 시간
                </th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  지속 시간
                </th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  상황
                </th>
              </tr>
            </thead>
            <tbody>
              {data.delay_segments.map((segment, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      color: SEGMENT_COLORS[segment.segment_type],
                      fontWeight: 'bold',
                    }}
                  >
                    {segment.segment_type}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatTime(segment.start_time_ms)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {formatTime(segment.duration_ms)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                    {segment.context?.before_event || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div style={{ marginBottom: '30px' }}>
        <h3>문제 풀이 단계</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.phase_breakdown.map((phase, idx) => (
            <div
              key={idx}
              style={{
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '5px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong>{phase.phase}</strong>
                <span style={{ color: '#666' }}>
                  {formatTime(phase.start_ms)} - {formatTime(phase.end_ms)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <h3>교육적 제안</h3>
          <ul style={{ lineHeight: '1.8' }}>
            {data.recommendations.map((rec, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ThinkingFlowGraph;
