import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { EquationParams } from '../types/equation.types';
import { generateGraphData } from '../utils/graphGenerator';

interface GraphCanvasProps {
  equation: EquationParams;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ equation }) => {
  const [graphData, setGraphData] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const data = generateGraphData(equation);
    setGraphData(data.points);
  }, [equation]);

  const { xMin = -10, xMax = 10, yMin = -10, yMax = 10 } = equation;

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={graphData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* X축과 Y축 */}
          <XAxis
            type="number"
            dataKey="x"
            domain={[xMin, xMax]}
            ticks={Array.from({ length: 11 }, (_, i) => xMin + (i * (xMax - xMin) / 10))}
            tickFormatter={(value) => value.toFixed(1)}
            stroke="#666"
            style={{ fontSize: '10px' }}
          />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            ticks={Array.from({ length: 11 }, (_, i) => yMin + (i * (yMax - yMin) / 10))}
            tickFormatter={(value) => value.toFixed(1)}
            stroke="#666"
            style={{ fontSize: '10px' }}
          />

          {/* 원점 기준선 */}
          <ReferenceLine x={0} stroke="#999" strokeWidth={1} />
          <ReferenceLine y={0} stroke="#999" strokeWidth={1} />

          {/* 툴팁 */}
          <Tooltip
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={(label) => `x: ${Number(label).toFixed(2)}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          />

          {/* 그래프 선 */}
          <Line
            type="monotone"
            dataKey="y"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphCanvas;
