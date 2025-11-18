/**
 * Color Partition Graph Component
 * Displays function graph with color-coded interval layers
 */
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { Interval, PlotPoint } from '../../types';

interface ColorPartitionGraphProps {
  plotPoints: PlotPoint[];
  intervals: Interval[];
  expression: string;
  showIntervals?: boolean;
}

export const ColorPartitionGraph: React.FC<ColorPartitionGraphProps> = ({
  plotPoints,
  intervals,
  expression,
  showIntervals = true,
}) => {
  // Group intervals by property type for layered display
  const intervalsByProperty = useMemo(() => {
    const grouped: Record<string, Interval[]> = {};
    intervals.forEach((interval) => {
      if (!grouped[interval.property]) {
        grouped[interval.property] = [];
      }
      grouped[interval.property].push(interval);
    });
    return grouped;
  }, [intervals]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={plotPoints}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'x', position: 'insideBottomRight', offset: -10 }}
            stroke="#666"
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={['auto', 'auto']}
            label={{ value: 'y', angle: -90, position: 'insideLeft' }}
            stroke="#666"
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
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '12px' }}>
                      <strong>x:</strong> {payload[0].payload.x.toFixed(3)}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px' }}>
                      <strong>y:</strong> {payload[0].payload.y.toFixed(3)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            content={() => (
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong>{expression}</strong>
              </div>
            )}
          />

          {/* Render color-coded interval layers */}
          {showIntervals &&
            intervals.map((interval, index) => (
              <ReferenceArea
                key={`interval-${index}`}
                x1={interval.start}
                x2={interval.end}
                fill={interval.color}
                fillOpacity={0.3}
                stroke={interval.color}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
            ))}

          {/* Main function line */}
          <Line
            type="monotone"
            dataKey="y"
            stroke="#1976d2"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ColorPartitionGraph;
