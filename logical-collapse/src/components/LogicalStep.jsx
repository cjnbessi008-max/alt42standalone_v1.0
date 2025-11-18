import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/LogicalStep.css';

const LogicalStep = ({ step, index, isSelected, isCurrent, onClick, onCheck }) => {
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (step.collapsed && !isCollapsing) {
      triggerCollapse();
    }
  }, [step.collapsed]);

  const triggerCollapse = () => {
    setIsCollapsing(true);

    // Collapse animation sequence
    setTimeout(() => {
      setIsCollapsed(true);
      setIsCollapsing(false);
    }, 1500); // Duration of collapse animation
  };

  // Collapse animation variants
  const collapseVariants = {
    normal: {
      opacity: 1,
      height: 'auto',
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    collapsing: {
      opacity: [1, 0.8, 0.6, 0.3, 0],
      height: ['auto', '80%', '60%', '40%', '20%', 0],
      scale: [1, 0.98, 0.95, 0.9, 0.8, 0.6],
      rotateX: [0, 5, 10, 20, 45, 90],
      transition: {
        duration: 1.5,
        ease: [0.43, 0.13, 0.23, 0.96],
        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
      }
    },
    collapsed: {
      opacity: 0,
      height: 0,
      scale: 0,
      rotateX: 90,
      transition: {
        duration: 0.2
      }
    }
  };

  // Particle effect for collapse
  const renderCollapseParticles = () => {
    if (!isCollapsing && !step.incorrect) return null;

    const particles = Array.from({ length: 15 }, (_, i) => i);

    return (
      <div className="collapse-particles">
        {particles.map((i) => (
          <motion.div
            key={`particle-${i}`}
            className="particle"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 + 50,
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    );
  };

  const getStepState = () => {
    if (isCollapsed) return 'collapsed';
    if (isCollapsing) return 'collapsing';
    return 'normal';
  };

  return (
    <motion.div
      className={`logical-step ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''} ${step.incorrect ? 'incorrect' : ''}`}
      variants={collapseVariants}
      initial="normal"
      animate={getStepState()}
      exit="collapsed"
      layout
      onClick={onClick}
    >
      <div className="step-header">
        <span className="step-number">{index + 1}</span>
        <span className="step-type">{step.type || '추론'}</span>
        {step.incorrect && (
          <motion.span
            className="incorrect-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            ✗
          </motion.span>
        )}
      </div>

      <div className="step-content">
        <p className="step-text">{step.text}</p>

        {step.formula && (
          <div className="step-formula">
            <code>{step.formula}</code>
          </div>
        )}

        {step.explanation && (
          <p className="step-explanation">{step.explanation}</p>
        )}
      </div>

      {step.requires_validation && !step.collapsed && (
        <motion.button
          className="validate-button"
          onClick={(e) => {
            e.stopPropagation();
            onCheck();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          검증하기
        </motion.button>
      )}

      {renderCollapseParticles()}

      {/* Crack effect overlay for collapsing */}
      {isCollapsing && (
        <motion.div
          className="crack-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="crack-svg" viewBox="0 0 100 100">
            <motion.path
              d="M 20 50 Q 30 30, 50 50 T 80 50"
              stroke="#ff0000"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
            <motion.path
              d="M 50 20 Q 60 40, 50 60 T 50 80"
              stroke="#ff0000"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LogicalStep;
