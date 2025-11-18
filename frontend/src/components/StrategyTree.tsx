import { useState } from 'react';
import { motion } from 'framer-motion';
import { StrategyStep } from '../types';
import { StrategyBubble } from './StrategyBubble';

interface StrategyTreeProps {
  steps: StrategyStep[];
}

export const StrategyTree: React.FC<StrategyTreeProps> = ({ steps }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // 루트 단계 (parent_id가 null인 것들)
  const rootSteps = steps.filter((step) => !step.parent_id);

  // 특정 단계의 자식들을 가져오기
  const getChildren = (parentId: string): StrategyStep[] => {
    return steps
      .filter((step) => step.parent_id === parentId)
      .sort((a, b) => a.order - b.order);
  };

  // 단계 확장/축소 토글
  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  // 재귀적으로 단계와 자식들을 렌더링
  const renderStep = (step: StrategyStep, depth: number = 0): JSX.Element => {
    const children = getChildren(step.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedSteps.has(step.id);

    return (
      <div key={step.id} className="flex flex-col items-center">
        <StrategyBubble
          step={step}
          delay={depth * 0.1 + step.order * 0.15}
          onExpand={toggleExpand}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
        />

        {/* 자식 단계들 */}
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col gap-6 items-center"
          >
            {children.map((child) => renderStep(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-8 px-4">
      <div className="flex flex-col gap-8 items-center">
        {rootSteps
          .sort((a, b) => a.order - b.order)
          .map((step) => renderStep(step, 0))}
      </div>
    </div>
  );
};
