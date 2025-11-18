import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SetElement, SetCondition } from '../types';
import './SetDance.css';

interface SetDanceProps {
  elements: SetElement[];
  condition: SetCondition;
  onAnimationComplete?: () => void;
}

export const SetDance: React.FC<SetDanceProps> = ({
  elements,
  condition,
  onAnimationComplete
}) => {
  const [sortedElements, setSortedElements] = useState<{
    matching: SetElement[];
    notMatching: SetElement[];
  }>({ matching: [], notMatching: [] });

  useEffect(() => {
    const matching: SetElement[] = [];
    const notMatching: SetElement[] = [];

    elements.forEach(element => {
      if (matchesCondition(element, condition)) {
        matching.push(element);
      } else {
        notMatching.push(element);
      }
    });

    setSortedElements({ matching, notMatching });
  }, [elements, condition]);

  const matchesCondition = (element: SetElement, condition: SetCondition): boolean => {
    switch (condition.type) {
      case 'even':
        return element.value % 2 === 0;
      case 'odd':
        return element.value % 2 !== 0;
      case 'greater':
        return condition.value !== undefined && element.value > condition.value;
      case 'less':
        return condition.value !== undefined && element.value < condition.value;
      case 'range':
        return (
          condition.min !== undefined &&
          condition.max !== undefined &&
          element.value >= condition.min &&
          element.value <= condition.max
        );
      case 'custom':
        return condition.customFn ? condition.customFn(element) : false;
      default:
        return false;
    }
  };

  const getConditionLabel = (condition: SetCondition): string => {
    switch (condition.type) {
      case 'even':
        return '짝수';
      case 'odd':
        return '홀수';
      case 'greater':
        return `${condition.value}보다 큰 수`;
      case 'less':
        return `${condition.value}보다 작은 수`;
      case 'range':
        return `${condition.min}~${condition.max} 범위`;
      default:
        return '조건';
    }
  };

  return (
    <div className="set-dance-container">
      <div className="condition-label">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="condition-badge"
        >
          {getConditionLabel(condition)}
        </motion.div>
      </div>

      <div className="sets-wrapper">
        <div className="set-section matching">
          <h3 className="set-title">✓ 조건에 맞는 원소</h3>
          <div className="elements-grid">
            <AnimatePresence mode="popLayout">
              {sortedElements.matching.map((element, index) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{
                    scale: 0,
                    opacity: 0,
                    rotate: -180,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                    x: 0,
                    y: 0
                  }}
                  exit={{
                    scale: 0,
                    opacity: 0,
                    rotate: 180
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="element-card matching"
                  style={{
                    backgroundColor: element.color || '#4ade80',
                  }}
                  onAnimationComplete={
                    index === sortedElements.matching.length - 1
                      ? onAnimationComplete
                      : undefined
                  }
                >
                  <div className="element-value">{element.value}</div>
                  {element.label && (
                    <div className="element-label">{element.label}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="set-section not-matching">
          <h3 className="set-title">✗ 조건에 맞지 않는 원소</h3>
          <div className="elements-grid">
            <AnimatePresence mode="popLayout">
              {sortedElements.notMatching.map((element, index) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{
                    scale: 0,
                    opacity: 0,
                    rotate: 180,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                    x: 0,
                    y: 0
                  }}
                  exit={{
                    scale: 0,
                    opacity: 0,
                    rotate: -180
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    delay: index * 0.05 + sortedElements.matching.length * 0.05,
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: -5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="element-card not-matching"
                  style={{
                    backgroundColor: element.color || '#f87171',
                  }}
                >
                  <div className="element-value">{element.value}</div>
                  {element.label && (
                    <div className="element-label">{element.label}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
