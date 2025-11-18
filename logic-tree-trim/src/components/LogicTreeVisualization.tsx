/**
 * LogicTreeVisualization Component
 * 논리 트리 전체 시각화 및 애니메이션 제어
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogicNode, SimplificationStep } from '../types/logic';
import { TreeNode } from './TreeNode';
import { treeToString } from '../logic/parser';

interface LogicTreeVisualizationProps {
  originalTree: LogicNode;
  steps: SimplificationStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const LogicTreeVisualization: React.FC<LogicTreeVisualizationProps> = ({
  originalTree,
  steps,
  currentStep,
  onStepChange,
}) => {
  const [currentTree, setCurrentTree] = useState<LogicNode>(originalTree);
  const [isPruning, setIsPruning] = useState(false);

  useEffect(() => {
    if (currentStep === 0) {
      setCurrentTree(originalTree);
    } else if (currentStep <= steps.length) {
      // 단계별 애니메이션
      setIsPruning(true);

      setTimeout(() => {
        setCurrentTree(steps[currentStep - 1].after);
        setIsPruning(false);
      }, 800);
    }
  }, [currentStep, originalTree, steps]);

  const currentStepInfo = currentStep > 0 && currentStep <= steps.length ? steps[currentStep - 1] : null;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">Logic Tree Trim</h1>
        <p className="text-xs text-center mt-1 opacity-90">논리식 단순화 시각화</p>
      </div>

      {/* 트리 영역 */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <TreeNode node={currentTree} depth={0} isPruning={isPruning} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 정보 패널 */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        {/* 현재 식 표시 */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">현재 식:</p>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-300">
            {treeToString(currentTree)}
          </p>
        </div>

        {/* 단계 정보 */}
        {currentStepInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded"
          >
            <p className="font-semibold text-sm text-blue-900 mb-1">
              {currentStepInfo.rule}
            </p>
            <p className="text-xs text-blue-700">{currentStepInfo.description}</p>
          </motion.div>
        )}

        {/* 진행 상황 */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>단계: {currentStep} / {steps.length}</span>
          <span>
            {currentStep === 0 && '원본'}
            {currentStep > 0 && currentStep < steps.length && '단순화 중...'}
            {currentStep === steps.length && '완료!'}
          </span>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <motion.div
            className="bg-indigo-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded font-semibold text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-300 transition-colors"
          >
            ← 이전
          </button>

          <button
            onClick={() => onStepChange(0)}
            className="py-2 px-4 bg-yellow-500 text-white rounded font-semibold text-sm
                     hover:bg-yellow-600 transition-colors"
          >
            ↺ 처음
          </button>

          <button
            onClick={() => onStepChange(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === steps.length}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded font-semibold text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-indigo-700 transition-colors"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
};
