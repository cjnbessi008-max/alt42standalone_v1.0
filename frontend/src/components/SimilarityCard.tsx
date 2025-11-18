import React from 'react';
import { motion } from 'framer-motion';
import { SimilarityCondition } from '../types/similarity';
import '../styles/SimilarityCard.css';

interface SimilarityCardProps {
  condition: SimilarityCondition;
  isActive?: boolean;
  onClick?: () => void;
  delay?: number;
}

/**
 * 닮음 조건을 표시하는 빛나는 카드 컴포넌트
 */
export const SimilarityCard: React.FC<SimilarityCardProps> = ({
  condition,
  isActive = false,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      className={`similarity-card ${isActive ? 'active' : ''}`}
      style={{
        '--card-color': condition.color,
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 0 30px ${condition.color}`,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Glow effect background */}
      <div className="card-glow"></div>

      {/* Card content */}
      <div className="card-content">
        {/* Icon/Symbol */}
        <motion.div
          className="card-icon"
          animate={isActive ? {
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          {condition.icon}
        </motion.div>

        {/* Type badge */}
        <div className="card-type">
          {condition.type}
        </div>

        {/* Korean name */}
        <h3 className="card-title-ko">
          {condition.nameKo}
        </h3>

        {/* English name */}
        <p className="card-title-en">
          {condition.name}
        </p>

        {/* Formula */}
        <div className="card-formula">
          {condition.formula}
        </div>

        {/* Description */}
        <p className="card-description">
          {condition.descriptionKo}
        </p>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="active-indicator"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="card-shimmer"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />
    </motion.div>
  );
};

export default SimilarityCard;
