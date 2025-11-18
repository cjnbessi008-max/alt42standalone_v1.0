import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoxplotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  label: string;
}

interface BoxplotSnapProps {
  data: BoxplotData;
  color?: string;
}

export const BoxplotSnap = ({ data, color = '#3b82f6' }: BoxplotSnapProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 데이터 범위 계산
  const range = data.max - data.min;
  const scale = 200 / range; // 200px 높이에 맞춤

  // 위치 계산 (하단 기준)
  const getY = (value: number) => {
    return 200 - (value - data.min) * scale;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 레이블 */}
        <div className="text-center mb-4 font-semibold text-gray-700">
          {data.label}
        </div>

        <svg width="120" height="240" className="overflow-visible">
          {/* 중앙선 (min-max) */}
          <motion.line
            x1="60"
            y1={getY(data.min)}
            x2="60"
            y2={getY(data.max)}
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          {/* Min 라인 */}
          <motion.line
            x1="40"
            y1={getY(data.min)}
            x2="80"
            y2={getY(data.min)}
            stroke={color}
            strokeWidth="2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />

          {/* Max 라인 */}
          <motion.line
            x1="40"
            y1={getY(data.max)}
            x2="80"
            y2={getY(data.max)}
            stroke={color}
            strokeWidth="2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />

          {/* 박스 (Q1-Q3) - 애니메이션 효과 */}
          <motion.rect
            x="30"
            y={isExpanded ? getY(data.q3) : getY(data.median) - 5}
            width="60"
            height={isExpanded ? getY(data.q1) - getY(data.q3) : 10}
            fill={color}
            fillOpacity="0.3"
            stroke={color}
            strokeWidth="2"
            rx="4"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              y: isExpanded ? getY(data.q3) : getY(data.median) - 5,
              height: isExpanded ? getY(data.q1) - getY(data.q3) : 10
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1] // 부드러운 스냅 효과
            }}
          />

          {/* 중앙값 라인 */}
          <motion.line
            x1="30"
            y1={getY(data.median)}
            x2="90"
            y2={getY(data.median)}
            stroke={color}
            strokeWidth="3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          />

          {/* 값 표시 (확장 시) */}
          <AnimatePresence>
            {isExpanded && (
              <>
                <motion.text
                  x="95"
                  y={getY(data.max) + 5}
                  fontSize="10"
                  fill={color}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.3 }}
                >
                  Max: {data.max}
                </motion.text>
                <motion.text
                  x="95"
                  y={getY(data.q3) + 5}
                  fontSize="10"
                  fill={color}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.4 }}
                >
                  Q3: {data.q3}
                </motion.text>
                <motion.text
                  x="95"
                  y={getY(data.median) + 5}
                  fontSize="10"
                  fill={color}
                  fontWeight="bold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.5 }}
                >
                  M: {data.median}
                </motion.text>
                <motion.text
                  x="95"
                  y={getY(data.q1) + 5}
                  fontSize="10"
                  fill={color}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.6 }}
                >
                  Q1: {data.q1}
                </motion.text>
                <motion.text
                  x="95"
                  y={getY(data.min) + 5}
                  fontSize="10"
                  fill={color}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.7 }}
                >
                  Min: {data.min}
                </motion.text>
              </>
            )}
          </AnimatePresence>
        </svg>

        {/* 상태 표시 */}
        <motion.div
          className="text-center mt-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {isExpanded ? '📊 클릭하여 닫기' : '👆 클릭하여 상세 보기'}
        </motion.div>
      </motion.div>
    </div>
  );
};
