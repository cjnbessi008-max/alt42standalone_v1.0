import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formula, FormulaComponent } from '../types';

interface FormulaDisplayProps {
  formula: Formula;
  visible: boolean;
  highlightComponentId?: string;
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({
  formula,
  visible,
  highlightComponentId
}) => {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-xl p-12 mb-8"
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl md:text-6xl font-mono text-gray-800 tracking-wide">
              {renderFormulaWithComponents(formula, highlightComponentId)}
            </div>
          </motion.div>

          {/* 장식 효과 */}
          <motion.div
            className="mt-8 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function renderFormulaWithComponents(
  formula: Formula,
  highlightComponentId?: string
): React.ReactNode {
  if (formula.components.length === 0) {
    return <span>{formula.text}</span>;
  }

  const elements: React.ReactNode[] = [];
  let lastPosition = 0;

  // 컴포넌트들을 순서대로 렌더링
  const sortedComponents = [...formula.components].sort((a, b) => a.position - b.position);

  sortedComponents.forEach((component, index) => {
    // 이전 컴포넌트와 현재 컴포넌트 사이의 텍스트 추가
    if (component.position > lastPosition) {
      const betweenText = formula.text.substring(lastPosition, component.position);
      if (betweenText) {
        elements.push(<span key={`between-${index}`}>{betweenText}</span>);
      }
    }

    // 컴포넌트 렌더링
    const isHighlighted = highlightComponentId === component.id;
    elements.push(
      <motion.span
        key={component.id}
        className={`inline-block ${getComponentColor(component.type)} ${
          isHighlighted ? 'bg-yellow-200 px-2 py-1 rounded' : ''
        }`}
        animate={isHighlighted ? {
          scale: [1, 1.1, 1],
          transition: { duration: 0.5, repeat: 2 }
        } : {}}
      >
        {component.text}
      </motion.span>
    );

    lastPosition = component.position + component.text.length;
  });

  // 마지막 컴포넌트 이후의 텍스트 추가
  if (lastPosition < formula.text.length) {
    const remainingText = formula.text.substring(lastPosition);
    if (remainingText) {
      elements.push(<span key="remaining">{remainingText}</span>);
    }
  }

  return <>{elements}</>;
}

function getComponentColor(type: FormulaComponent['type']): string {
  switch (type) {
    case 'variable':
      return 'text-blue-600';
    case 'operator':
      return 'text-purple-600';
    case 'constant':
      return 'text-green-600';
    case 'function':
      return 'text-orange-600';
    case 'expression':
      return 'text-gray-800';
    default:
      return 'text-gray-800';
  }
}
