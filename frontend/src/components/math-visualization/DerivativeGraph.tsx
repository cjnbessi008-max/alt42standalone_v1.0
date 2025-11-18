/**
 * DerivativeGraph Component
 * Displays derivatives with different line styles using Recharts
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
  ReferenceLine,
} from 'recharts';
import type { GraphData } from '@/types/derivative';

interface DerivativeGraphProps {
  graphData: GraphData;
  width?: number | string;
  height?: number | string;
  showLegend?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
}

const DerivativeGraph: React.FC<DerivativeGraphProps> = ({
  graphData,
  width = '100%',
  height = 500,
  showLegend = true,
  showGrid = true,
  interactive = true,
}) => {
  // Transform data for Recharts format
  const chartData = useMemo(() => {
    return graphData.x_values.map((x, index) => {
      const point: any = { x };

      graphData.datasets.forEach((dataset) => {
        const key = `order_${dataset.order}`;
        const value = dataset.data[index];
        // Filter out NaN and Infinity
        point[key] = isFinite(value) ? value : null;
      });

      return point;
    });
  }, [graphData]);

  // Get stroke dash array for different line styles
  const getStrokeDashArray = (lineStyle: string, dashPattern?: number[] | null): string => {
    if (lineStyle === 'solid' || !dashPattern) {
      return '';
    }
    return dashPattern.join(' ');
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>x = {label.toFixed(3)}</p>
          {payload.map((entry: any, index: number) => {
            const dataset = graphData.datasets.find(
              (ds) => `order_${ds.order}` === entry.dataKey
            );
            if (!dataset) return null;

            return (
              <p
                key={index}
                style={{
                  margin: '4px 0',
                  color: entry.color,
                }}
              >
                {dataset.symbol} = {entry.value?.toFixed(3) || 'undefined'}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '10px',
        }}
      >
        {payload.map((entry: any, index: number) => {
          const dataset = graphData.datasets.find(
            (ds) => `order_${ds.order}` === entry.dataKey
          );
          if (!dataset) return null;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="40" height="3">
                <line
                  x1="0"
                  y1="1.5"
                  x2="40"
                  y2="1.5"
                  stroke={entry.color}
                  strokeWidth={dataset.style.line_width}
                  strokeDasharray={getStrokeDashArray(
                    dataset.style.line_style,
                    dataset.style.dash_pattern
                  )}
                />
              </svg>
              <span style={{ fontSize: '14px' }}>
                {dataset.symbol}: {dataset.expression}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={graphData.grid.grid_color}
          />
        )}

        <XAxis
          dataKey="x"
          type="number"
          domain={[graphData.grid.x_axis.min, graphData.grid.x_axis.max]}
          label={{
            value: graphData.grid.x_axis.label,
            position: 'insideBottomRight',
            offset: -5,
          }}
          tickFormatter={(value) => value.toFixed(1)}
        />

        <YAxis
          domain={[graphData.grid.y_axis.min, graphData.grid.y_axis.max]}
          label={{
            value: graphData.grid.y_axis.label,
            angle: -90,
            position: 'insideLeft',
          }}
          tickFormatter={(value) => value.toFixed(1)}
        />

        {/* X-axis reference line */}
        <ReferenceLine y={0} stroke="#000" strokeWidth={1} />

        {/* Y-axis reference line */}
        <ReferenceLine x={0} stroke="#000" strokeWidth={1} />

        {/* Critical points markers */}
        {graphData.metadata.critical_points.map((point, index) => (
          <ReferenceLine
            key={`critical-${index}`}
            x={point}
            stroke="#E74C3C"
            strokeDasharray="5 5"
            label={{ value: 'Critical', position: 'top', fontSize: 10 }}
          />
        ))}

        {/* Inflection points markers */}
        {graphData.metadata.inflection_points.map((point, index) => (
          <ReferenceLine
            key={`inflection-${index}`}
            x={point}
            stroke="#3498DB"
            strokeDasharray="3 3"
            label={{ value: 'Inflection', position: 'top', fontSize: 10 }}
          />
        ))}

        {interactive && <Tooltip content={<CustomTooltip />} />}

        {showLegend && <Legend content={<CustomLegend />} />}

        {/* Render lines for each derivative */}
        {graphData.datasets.map((dataset) => (
          <Line
            key={dataset.order}
            type="monotone"
            dataKey={`order_${dataset.order}`}
            name={dataset.symbol}
            stroke={dataset.style.color}
            strokeWidth={dataset.style.line_width}
            strokeDasharray={getStrokeDashArray(
              dataset.style.line_style,
              dataset.style.dash_pattern
            )}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DerivativeGraph;
