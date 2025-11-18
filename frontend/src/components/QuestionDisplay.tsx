/**
 * Question Display Component
 * Displays a question with logical operator animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OperandNode from './OperandNode';
import LogicalLinkAnimation from './LogicalLinkAnimation';
import { useProgressStore } from '@stores/progressStore';
import type { QuestionDisplayProps } from '@types/index';

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  onAnswer,
  onComplete,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userAnswer, setUserAnswer] = useState<Record<string, boolean>>({});

  const incrementInteraction = useProgressStore((state) => state.incrementInteraction);

  // Node positions - arranged in a flow
  const getNodePosition = (index: number, total: number) => {
    const centerX = 150;
    const startY = 100;
    const spacing = 120;

    return {
      x: centerX - 60,
      y: startY + index * spacing,
    };
  };

  const operators = question.operators || [];
  const totalOperators = operators.length;

  useEffect(() => {
    // Auto-start animation after a brief delay
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [question.id]);

  const handleNodeClick = (nodeId: string) => {
    incrementInteraction();

    setSelectedNodes((prev) => {
      if (prev.includes(nodeId)) {
        return prev.filter((id) => id !== nodeId);
      }
      return [...prev, nodeId];
    });
  };

  const handleAnswerChange = (operatorId: number, value: boolean) => {
    incrementInteraction();
    setUserAnswer((prev) => ({
      ...prev,
      [operatorId]: value,
    }));
  };

  const handleSubmit = () => {
    incrementInteraction();

    // Check if all operators have been answered
    const allAnswered = operators.every(
      (op) => userAnswer[op.operator_id] !== undefined
    );

    if (!allAnswered) {
      alert('모든 논리연결사에 대해 답변해주세요!');
      return;
    }

    // Calculate correctness
    const correctCount = operators.filter(
      (op) => userAnswer[op.operator_id] === op.expected_result
    ).length;

    const isCorrect = correctCount === operators.length;

    setIsCompleted(true);
    onAnswer(userAnswer);
    onComplete(isCorrect);
  };

  const handleAnimationComplete = () => {
    if (currentAnimationIndex < totalOperators - 1) {
      setTimeout(() => {
        setCurrentAnimationIndex((prev) => prev + 1);
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {question.title}
        </h2>
        {question.description && (
          <p className="text-sm text-gray-600">{question.description}</p>
        )}
      </motion.div>

      {/* Visualization Area */}
      <div className="relative w-full" style={{ height: '400px' }}>
        {/* Operand Nodes */}
        {operators.map((operator, index) => {
          const position = getNodePosition(index, totalOperators);

          return (
            <React.Fragment key={`operand-${index}`}>
              {/* Left Operand */}
              <OperandNode
                id={`left-${index}`}
                text={operator.operand_left}
                position={position}
                isActive={selectedNodes.includes(`left-${index}`)}
                isCorrect={
                  isCompleted
                    ? userAnswer[operator.operator_id] === operator.expected_result
                    : undefined
                }
                onClick={() => handleNodeClick(`left-${index}`)}
              />

              {/* Right Operand */}
              <OperandNode
                id={`right-${index}`}
                text={operator.operand_right}
                position={{
                  x: position.x + 150,
                  y: position.y,
                }}
                isActive={selectedNodes.includes(`right-${index}`)}
                isCorrect={
                  isCompleted
                    ? userAnswer[operator.operator_id] === operator.expected_result
                    : undefined
                }
                onClick={() => handleNodeClick(`right-${index}`)}
              />

              {/* Animation */}
              <AnimatePresence>
                {showAnimation && currentAnimationIndex >= index && (
                  <LogicalLinkAnimation
                    operator={operator}
                    fromPosition={{
                      x: position.x + 110,
                      y: position.y + 20,
                    }}
                    toPosition={{
                      x: position.x + 150,
                      y: position.y + 20,
                    }}
                    duration={1000}
                    onComplete={
                      index === currentAnimationIndex
                        ? handleAnimationComplete
                        : undefined
                    }
                  />
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </div>

      {/* Answer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-800">
          각 논리연결사의 결과를 선택하세요:
        </h3>

        {operators.map((operator) => (
          <div
            key={operator.operator_id}
            className="bg-white rounded-lg p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: operator.color_code }}
                />
                <span className="font-medium" style={{ color: operator.color_code }}>
                  {operator.korean_name}
                </span>
                <span className="text-sm text-gray-600">
                  ({operator.operand_left} {operator.korean_name}{' '}
                  {operator.operand_right})
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswerChange(operator.operator_id, true)}
                  disabled={isCompleted}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${
                      userAnswer[operator.operator_id] === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }
                    ${isCompleted ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  참 (True)
                </button>
                <button
                  onClick={() => handleAnswerChange(operator.operator_id, false)}
                  disabled={isCompleted}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${
                      userAnswer[operator.operator_id] === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                    }
                    ${isCompleted ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  거짓 (False)
                </button>
              </div>
            </div>

            {/* Show correct answer after completion */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 pt-2 border-t"
              >
                <span className="text-sm">
                  정답:{' '}
                  <span
                    className={`font-bold ${
                      operator.expected_result ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {operator.expected_result ? '참' : '거짓'}
                  </span>
                  {userAnswer[operator.operator_id] !== operator.expected_result && (
                    <span className="text-red-500 ml-2">✗ 틀렸습니다</span>
                  )}
                  {userAnswer[operator.operator_id] === operator.expected_result && (
                    <span className="text-green-500 ml-2">✓ 맞았습니다</span>
                  )}
                </span>
              </motion.div>
            )}
          </div>
        ))}

        {/* Submit Button */}
        {!isCompleted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white
                       py-3 rounded-lg font-bold text-lg shadow-lg
                       hover:shadow-xl transition-all"
          >
            제출하기
          </motion.button>
        )}

        {/* Result Message */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              p-4 rounded-lg text-center font-bold text-lg
              ${
                operators.every(
                  (op) => userAnswer[op.operator_id] === op.expected_result
                )
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            `}
          >
            {operators.every(
              (op) => userAnswer[op.operator_id] === op.expected_result
            )
              ? '🎉 완벽합니다! 모두 맞았습니다!'
              : '💪 다시 한번 도전해보세요!'}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuestionDisplay;
