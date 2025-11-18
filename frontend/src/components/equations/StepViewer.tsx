/**
 * StepViewer Component
 * Displays a list of equation simplification steps
 * Part of KAIST Touch Math Academy AI Education System
 */

import React from 'react';
import { motion } from 'framer-motion';
import { StepViewerProps } from '../../types/equation.types';
import { EquationRenderer } from './EquationRenderer';
import '../../styles/step-viewer.css';

/**
 * Component for displaying a navigable list of equation steps
 * Allows users to jump to specific steps
 */
export const StepViewer: React.FC<StepViewerProps> = ({
  steps,
  currentStep,
  onStepSelect,
  showDescriptions = true,
  showRules = true,
}) => {
  return (
    <div className="step-viewer" role="navigation" aria-label="Equation simplification steps">
      <h4 className="step-viewer-title">Simplification Steps</h4>

      <div className="steps-list">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          const isFuture = index > currentStep;

          return (
            <motion.div
              key={step.id}
              className={`step-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onStepSelect?.(index)}
              role="button"
              tabIndex={0}
              aria-label={`Step ${index + 1}: ${step.description}`}
              aria-current={isActive ? 'step' : undefined}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepSelect?.(index);
                }
              }}
            >
              {/* Step Number */}
              <div className="step-number">
                <span className="number">{index + 1}</span>
                {isPast && <span className="check-mark">✓</span>}
              </div>

              {/* Step Content */}
              <div className="step-content">
                {/* Equation */}
                <div className="step-equation">
                  <EquationRenderer
                    equation={step.equation}
                    displayMode={false}
                    className="step-equation-inline"
                  />
                </div>

                {/* Description */}
                {showDescriptions && (
                  <p className="step-description">{step.description}</p>
                )}

                {/* Rule */}
                {showRules && (
                  <p className="step-rule">
                    <span className="rule-label">Rule:</span> {step.rule}
                  </p>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeIndicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="step-viewer-summary">
        <p>
          <strong>Total Steps:</strong> {steps.length}
        </p>
        <p>
          <strong>Current:</strong> Step {currentStep + 1}
        </p>
        <p>
          <strong>Progress:</strong>{' '}
          {Math.round(((currentStep + 1) / steps.length) * 100)}%
        </p>
      </div>
    </div>
  );
};

export default StepViewer;
