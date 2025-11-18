/**
 * Logical Link Animation Component
 * Animates logical operator connections between nodes
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LogicalLinkAnimationProps } from '@types/index';

const LogicalLinkAnimation: React.FC<LogicalLinkAnimationProps> = ({
  operator,
  fromPosition,
  toPosition,
  duration = 1000,
  onComplete,
}) => {
  const [pathLength, setPathLength] = useState(0);

  // Calculate path
  const dx = toPosition.x - fromPosition.x;
  const dy = toPosition.y - fromPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Control points for curved path
  const controlX = fromPosition.x + dx / 2;
  const controlY = fromPosition.y - 50; // Arc upward

  // SVG path
  const path = `M ${fromPosition.x} ${fromPosition.y} Q ${controlX} ${controlY} ${toPosition.x} ${toPosition.y}`;

  useEffect(() => {
    setPathLength(distance);
  }, [distance]);

  // Animation variants based on operator type
  const getAnimationVariants = () => {
    switch (operator.animation_type) {
      case 'flow':
        return {
          initial: { pathLength: 0, opacity: 0 },
          animate: {
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: duration / 1000, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
            },
          },
        };

      case 'pulse':
        return {
          initial: { pathLength: 1, opacity: 0 },
          animate: {
            pathLength: 1,
            opacity: [0, 1, 0.8, 1],
            transition: {
              duration: duration / 1000,
              times: [0, 0.3, 0.6, 1],
              ease: 'easeInOut',
            },
          },
        };

      case 'connect':
        return {
          initial: { pathLength: 0, opacity: 0 },
          animate: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: duration / 1000,
              ease: 'easeOut',
            },
          },
        };

      case 'branch':
        return {
          initial: { pathLength: 0, opacity: 0, scale: 0.8 },
          animate: {
            pathLength: 1,
            opacity: 1,
            scale: 1,
            transition: {
              duration: duration / 1000,
              ease: 'easeOut',
            },
          },
        };

      default:
        return {
          initial: { pathLength: 0, opacity: 0 },
          animate: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: duration / 1000 },
          },
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Animated Path */}
      <motion.path
        d={path}
        stroke={operator.color_code}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={variants}
        initial="initial"
        animate="animate"
        onAnimationComplete={onComplete}
        style={{
          filter: `drop-shadow(0 0 8px ${operator.color_code}40)`,
        }}
      />

      {/* Flowing particles effect for 'flow' type */}
      {operator.animation_type === 'flow' && (
        <>
          {[0, 0.3, 0.6].map((delay, index) => (
            <motion.circle
              key={index}
              r="4"
              fill={operator.color_code}
              initial={{ offsetDistance: '0%', opacity: 0 }}
              animate={{
                offsetDistance: '100%',
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: duration / 1000,
                delay: delay * (duration / 1000),
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                offsetPath: `path('${path}')`,
              }}
            />
          ))}
        </>
      )}

      {/* Operator symbol at midpoint */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: (duration / 2000), duration: 0.3 }}
      >
        <circle
          cx={controlX}
          cy={controlY}
          r="20"
          fill="white"
          stroke={operator.color_code}
          strokeWidth="2"
          filter={`drop-shadow(0 2px 8px ${operator.color_code}40)`}
        />
        <text
          x={controlX}
          y={controlY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="16"
          fontWeight="bold"
          fill={operator.color_code}
        >
          {operator.korean_name}
        </text>
      </motion.g>
    </svg>
  );
};

export default LogicalLinkAnimation;
