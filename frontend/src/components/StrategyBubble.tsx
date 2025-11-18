import { motion } from 'framer-motion';
import { useState } from 'react';
import { StrategyStep, StepType } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StrategyBubbleProps {
  step: StrategyStep;
  delay: number;
  onExpand?: (stepId: string) => void;
  hasChildren?: boolean;
  isExpanded?: boolean;
}

const stepTypeColors: Record<StepType, string> = {
  [StepType.ANALYSIS]: 'bg-blue-500',
  [StepType.STRATEGY]: 'bg-green-500',
  [StepType.SUBSTEP]: 'bg-amber-500',
  [StepType.SOLUTION]: 'bg-purple-500',
};

const stepTypeLabels: Record<StepType, string> = {
  [StepType.ANALYSIS]: '분석',
  [StepType.STRATEGY]: '전략',
  [StepType.SUBSTEP]: '단계',
  [StepType.SOLUTION]: '해답',
};

export const StrategyBubble: React.FC<StrategyBubbleProps> = ({
  step,
  delay,
  onExpand,
  hasChildren = false,
  isExpanded = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    setShowDetails(!showDetails);
    if (hasChildren && onExpand) {
      onExpand(step.id);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: delay,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="relative"
    >
      {/* 연결선 (부모가 있는 경우) */}
      {step.parent_id && (
        <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-gray-300 dark:bg-gray-600" />
      )}

      {/* 말풍선 */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-2xl p-6 shadow-lg
          ${stepTypeColors[step.type]} bg-opacity-10
          border-2 ${stepTypeColors[step.type].replace('bg-', 'border-')}
          hover:shadow-xl transition-shadow
          min-w-[280px] max-w-[400px]
        `}
      >
        {/* 타입 뱃지 */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`
              inline-block px-3 py-1 rounded-full text-xs font-semibold text-white
              ${stepTypeColors[step.type]}
            `}
          >
            {stepTypeLabels[step.type]}
          </span>

          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </motion.div>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">
          {step.title}
        </h3>

        {/* 내용 미리보기 */}
        <motion.div
          initial={false}
          animate={{ height: showDetails ? 'auto' : '60px' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {step.content}
          </p>
        </motion.div>

        {/* 더보기/접기 표시 */}
        {step.content.length > 100 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
            {showDetails ? '접기' : '더보기...'}
          </div>
        )}

        {/* 말풍선 꼬리 */}
        {step.parent_id && (
          <div
            className={`
              absolute -top-3 left-1/2 -translate-x-1/2
              w-0 h-0 border-l-8 border-r-8 border-b-8
              border-transparent
              ${stepTypeColors[step.type].replace('bg-', 'border-b-')}
              border-opacity-10
            `}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
