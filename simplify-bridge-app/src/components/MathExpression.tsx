/**
 * Math Expression Component
 * KaTeX를 사용하여 수학 표현식을 렌더링하는 컴포넌트
 */

import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathExpressionProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
}

export const MathExpression: React.FC<MathExpressionProps> = ({
  expression,
  displayMode = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(expression, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      } catch (error) {
        console.error('KaTeX 렌더링 오류:', error);
        if (containerRef.current) {
          containerRef.current.textContent = expression;
        }
      }
    }
  }, [expression, displayMode]);

  return <div ref={containerRef} className={`math-expression ${className}`} />;
};

export default MathExpression;
