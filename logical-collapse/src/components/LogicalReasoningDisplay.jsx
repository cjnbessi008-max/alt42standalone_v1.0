import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogicalStep from './LogicalStep';
import '../styles/LogicalReasoningDisplay.css';

const LogicalReasoningDisplay = ({ steps, currentStep, onStepValidation, problemTitle }) => {
  const [selectedStep, setSelectedStep] = useState(null);

  const handleStepClick = (stepIndex) => {
    setSelectedStep(stepIndex);
  };

  const handleStepCheck = (stepIndex) => {
    const step = steps[stepIndex];
    const isCorrect = step.is_correct !== false; // Assume correct unless marked false
    onStepValidation(stepIndex, isCorrect);
  };

  return (
    <div className="reasoning-container">
      <motion.div
        className="problem-title"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>{problemTitle || '문제'}</h3>
      </motion.div>

      <div className="steps-container">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <LogicalStep
              key={`step-${index}`}
              step={step}
              index={index}
              isSelected={selectedStep === index}
              isCurrent={currentStep === index}
              onClick={() => handleStepClick(index)}
              onCheck={() => handleStepCheck(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        className="reasoning-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="step-counter">
          단계 {currentStep + 1} / {steps.length}
        </p>
      </motion.div>
    </div>
  );
};

export default LogicalReasoningDisplay;
