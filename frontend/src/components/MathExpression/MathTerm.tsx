import React from 'react';
import { motion } from 'framer-motion';
import { MathTerm as MathTermType } from '@/types/math';

interface MathTermProps {
  term: MathTermType;
  position?: { x: number; y: number };
  color?: string;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

/**
 * Individual math term component with animation support
 * 애니메이션을 지원하는 개별 수학 항 컴포넌트
 */
export const MathTerm: React.FC<MathTermProps> = ({
  term,
  position = { x: 0, y: 0 },
  color = '#000000',
  isAnimating = false,
  onAnimationComplete,
}) => {
  const formatTerm = (t: MathTermType): string => {
    let result = '';

    // Coefficient
    const absCoeff = Math.abs(t.coefficient);
    if (t.isConstant) {
      result = absCoeff.toString();
    } else {
      if (absCoeff !== 1) {
        result = absCoeff.toString();
      }
    }

    // Variable
    if (t.variable) {
      result += t.variable;

      // Exponent
      if (t.exponent && t.exponent !== 1) {
        result += `^${t.exponent}`;
      }
    }

    return result;
  };

  const termText = formatTerm(term);
  const showSign = term.originalIndex > 0;
  const sign = term.coefficient >= 0 ? '+' : '−'; // Using minus sign (−) instead of hyphen (-)

  return (
    <motion.div
      className="inline-flex items-center gap-2"
      initial={false}
      animate={{
        x: position.x,
        y: position.y,
        scale: isAnimating ? [1, 1.2, 1] : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        duration: 0.6,
      }}
      onAnimationComplete={onAnimationComplete}
      style={{ color }}
    >
      {showSign && (
        <span className="text-2xl font-light opacity-70 mx-1">
          {sign}
        </span>
      )}
      <motion.span
        className="text-3xl font-semibold"
        whileHover={{ scale: 1.05 }}
      >
        {termText}
      </motion.span>
    </motion.div>
  );
};
