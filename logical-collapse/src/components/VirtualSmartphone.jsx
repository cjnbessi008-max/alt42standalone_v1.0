import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogicalReasoningDisplay from './LogicalReasoningDisplay';
import '../styles/VirtualSmartphone.css';

const VirtualSmartphone = ({ problemData }) => {
  const [reasoningSteps, setReasoningSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (problemData && problemData.reasoning_steps) {
      setReasoningSteps(problemData.reasoning_steps);
      setCurrentStep(0);
    }
  }, [problemData]);

  const handleStepValidation = (stepIndex, isCorrect) => {
    if (!isCorrect) {
      // Trigger collapse effect for incorrect reasoning
      const updatedSteps = [...reasoningSteps];
      updatedSteps[stepIndex].collapsed = true;
      updatedSteps[stepIndex].incorrect = true;
      setReasoningSteps(updatedSteps);
    }
  };

  return (
    <div className="smartphone-container">
      <motion.div
        className="smartphone-frame"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Phone hardware details */}
        <div className="phone-notch"></div>
        <div className="phone-speaker"></div>

        {/* Screen content */}
        <div className="phone-screen">
          <div className="screen-header">
            <span className="time">14:23</span>
            <div className="status-icons">
              <span className="battery">100%</span>
            </div>
          </div>

          <div className="app-content">
            <h2 className="app-title">논리적 추론 학습</h2>

            {problemData ? (
              <LogicalReasoningDisplay
                steps={reasoningSteps}
                currentStep={currentStep}
                onStepValidation={handleStepValidation}
                problemTitle={problemData.title}
              />
            ) : (
              <div className="empty-state">
                <p>LMS에서 문제를 불러오는 중...</p>
              </div>
            )}
          </div>

          {/* Virtual home button */}
          <div className="phone-home-button"></div>
        </div>

        {/* Phone frame borders */}
        <div className="phone-border-top"></div>
        <div className="phone-border-bottom"></div>
        <div className="phone-border-left"></div>
        <div className="phone-border-right"></div>
      </motion.div>
    </div>
  );
};

export default VirtualSmartphone;
