import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import type { MathFunction, AnimationState } from '../types';
import { generateGraphPoints } from '../utils/derivative';

interface GraphViewProps {
  functions: MathFunction[];
  animationState: AnimationState;
  xRange?: [number, number];
  yRange?: [number, number];
}

/**
 * 그래프 뷰 컴포넌트
 * Derivative Pulse 애니메이션 포함
 */
export const GraphView: React.FC<GraphViewProps> = ({
  functions,
  animationState,
  xRange = [-10, 10],
  yRange,
}) => {
  // 모든 함수의 그래프 포인트 생성
  const graphData = useMemo(() => {
    if (functions.length === 0) return [];

    const points = generateGraphPoints(functions[0].expression, xRange[0], xRange[1]);

    return points.map((point) => {
      const dataPoint: any = { x: point.x };

      functions.forEach((func) => {
        const funcPoints = generateGraphPoints(func.expression, xRange[0], xRange[1]);
        const matchingPoint = funcPoints.find(p => Math.abs(p.x - point.x) < 0.1);
        dataPoint[func.id] = matchingPoint?.y ?? null;
      });

      return dataPoint;
    });
  }, [functions, xRange]);

  // Derivative Pulse 애니메이션 설정
  const pulseVariants = {
    idle: {
      scale: 1,
      opacity: 1,
    },
    pulsing: {
      scale: [1, 0.95, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
    transitioning: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="p-4 bg-gray-50">
      <motion.div
        variants={pulseVariants}
        animate={animationState}
        className="bg-white rounded-lg shadow-md p-4"
      >
        {/* 그래프 제목 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">함수 그래프</h3>
          <p className="text-xs text-gray-500">
            {animationState === 'pulsing' && '✨ Derivative Pulse 애니메이션 실행 중...'}
            {animationState === 'idle' && '미분 버튼을 눌러보세요'}
          </p>
        </div>

        {/* Recharts 그래프 */}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={graphData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="x"
              type="number"
              domain={xRange}
              tickFormatter={(value) => value.toFixed(1)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={yRange || ['auto', 'auto']}
              tickFormatter={(value) => value.toFixed(1)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: any) => value?.toFixed(3)}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* 각 함수에 대한 라인 */}
            {functions.map((func, index) => (
              <Line
                key={func.id}
                type="monotone"
                dataKey={func.id}
                stroke={func.color}
                strokeWidth={index === 0 ? 3 : 2}
                dot={false}
                name={func.label}
                isAnimationActive={animationState === 'transitioning'}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {functions.map((func, index) => (
            <motion.div
              key={func.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-8 h-1 rounded"
                style={{ backgroundColor: func.color }}
              ></div>
              <span className="text-xs text-gray-600 font-mono">
                {func.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
