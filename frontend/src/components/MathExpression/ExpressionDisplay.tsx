import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathExpression } from '@/types/math';
import { MathTerm } from './MathTerm';

interface ExpressionDisplayProps {
  expression: MathExpression;
  highlightedTermIds?: string[];
  termColors?: Record<string, string>;
  showSteps?: boolean;
}

/**
 * Display a complete mathematical expression
 * 완전한 수학 수식을 표시하는 컴포넌트
 */
export const ExpressionDisplay: React.FC<ExpressionDisplayProps> = ({
  expression,
  highlightedTermIds = [],
  termColors = {},
  showSteps = false,
}) => {
  const defaultColor = '#1e293b'; // slate-800
  const highlightColor = '#3b82f6'; // blue-500

  return (
    <div className="flex items-center justify-center min-h-[120px] bg-white rounded-lg shadow-sm p-6">
      <motion.div
        className="flex items-center gap-1 flex-wrap justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {expression.terms.map((term, index) => {
            const isHighlighted = highlightedTermIds.includes(term.id);
            const color = termColors[term.id] ||
              (isHighlighted ? highlightColor : defaultColor);

            return (
              <MathTerm
                key={term.id}
                term={{ ...term, originalIndex: index }}
                color={color}
                isAnimating={isHighlighted}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {showSteps && (
        <motion.div
          className="mt-4 text-sm text-gray-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p>LaTeX: {expression.latex}</p>
        </motion.div>
      )}
    </div>
  );
};
