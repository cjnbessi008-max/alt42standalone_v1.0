/**
 * Operand Node Component
 * Displays an operand (statement) as an interactive node
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { OperandNodeProps } from '@types/index';

const OperandNode: React.FC<OperandNodeProps> = ({
  id,
  text,
  position,
  isActive = false,
  isCorrect,
  onClick,
}) => {
  const getBackgroundColor = () => {
    if (isCorrect === true) return 'bg-green-100 border-green-500';
    if (isCorrect === false) return 'bg-red-100 border-red-500';
    if (isActive) return 'bg-blue-100 border-blue-500';
    return 'bg-white border-gray-300';
  };

  const getTextColor = () => {
    if (isCorrect === true) return 'text-green-800';
    if (isCorrect === false) return 'text-red-800';
    if (isActive) return 'text-blue-800';
    return 'text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: onClick ? 1.05 : 1 }}
      whileTap={{ scale: onClick ? 0.95 : 1 }}
      className={`
        absolute rounded-lg border-2 p-4 shadow-lg
        transition-all duration-300 cursor-pointer
        ${getBackgroundColor()}
        ${onClick ? 'hover:shadow-xl' : ''}
      `}
      style={{
        left: position.x,
        top: position.y,
        minWidth: '120px',
        maxWidth: '200px',
      }}
      onClick={onClick}
    >
      {/* Node Content */}
      <div className={`text-sm font-medium text-center ${getTextColor()}`}>
        {text}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Correct/Incorrect Icon */}
      {isCorrect !== undefined && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: isCorrect ? '#4CAF50' : '#F44336',
          }}
        >
          <span className="text-white text-xs font-bold">
            {isCorrect ? '✓' : '✗'}
          </span>
        </motion.div>
      )}

      {/* Pulse Animation for Active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-blue-500"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.div>
  );
};

export default OperandNode;
