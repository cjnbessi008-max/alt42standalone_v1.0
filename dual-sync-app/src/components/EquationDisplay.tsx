import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import { formatEquation } from '../utils/equationSolver';
import { EquationParams } from '../types/equation.types';

interface EquationDisplayProps {
  equation: EquationParams;
  className?: string;
}

const EquationDisplay: React.FC<EquationDisplayProps> = ({ equation, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const latex = formatEquation(equation);
      try {
        katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (error) {
        console.error('KaTeX 렌더링 오류:', error);
        containerRef.current.textContent = latex;
      }
    }
  }, [equation]);

  return (
    <div
      ref={containerRef}
      className={`equation-display text-2xl font-bold text-center p-4 ${className}`}
    />
  );
};

export default EquationDisplay;
