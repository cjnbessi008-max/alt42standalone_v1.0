/**
 * EquationAnimator Component
 * Animates equation simplification steps with Framer Motion
 * Part of KAIST Touch Math Academy AI Education System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EquationAnimatorProps,
  InteractionEvent,
  DEFAULT_ANIMATION_CONFIG,
} from '../../types/equation.types';
import { EquationRenderer } from './EquationRenderer';
import '../../styles/equation-animator.css';

/**
 * Component for animating equation simplification steps
 * Features: play/pause, step navigation, speed control, highlight changes
 */
export const EquationAnimator: React.FC<EquationAnimatorProps> = ({
  problem,
  config: userConfig,
  onStepChange,
  onComplete,
  onInteraction,
}) => {
  const config = { ...DEFAULT_ANIMATION_CONFIG, ...userConfig };
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoPlay);
  const [speed, setSpeed] = useState(config.speedMultiplier);

  const currentStep = problem.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === problem.steps.length - 1;

  /**
   * Record interaction event
   */
  const recordInteraction = useCallback(
    (type: InteractionEvent['type'], metadata?: Record<string, any>) => {
      const event: InteractionEvent = {
        type,
        timestamp: new Date(),
        currentStep: currentStepIndex,
        metadata,
      };
      onInteraction?.(event);
    },
    [currentStepIndex, onInteraction]
  );

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    if (!isLastStep) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(newIndex, problem.steps[newIndex]);
      recordInteraction('step_forward');
    } else if (config.loop) {
      setCurrentStepIndex(0);
      onStepChange?.(0, problem.steps[0]);
      recordInteraction('step_forward', { looped: true });
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentStepIndex, isLastStep, config.loop, onStepChange, problem.steps, onComplete, recordInteraction]);

  /**
   * Navigate to previous step
   */
  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(newIndex, problem.steps[newIndex]);
      recordInteraction('step_backward');
    }
  }, [currentStepIndex, isFirstStep, onStepChange, problem.steps, recordInteraction]);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      recordInteraction(prev ? 'pause' : 'play');
      return !prev;
    });
  }, [recordInteraction]);

  /**
   * Reset to first step
   */
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    onStepChange?.(0, problem.steps[0]);
    recordInteraction('reset');
  }, [onStepChange, problem.steps, recordInteraction]);

  /**
   * Change playback speed
   */
  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    recordInteraction('speed_change', { speed: newSpeed });
  }, [recordInteraction]);

  /**
   * Auto-play functionality
   */
  useEffect(() => {
    if (!isPlaying) return;

    const adjustedDelay = (currentStep.delay || config.stepDelay) / speed;
    const timer = setTimeout(() => {
      nextStep();
    }, adjustedDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, config.stepDelay, speed, nextStep]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousStep();
          break;
        case 'r':
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, nextStep, previousStep, reset]);

  return (
    <div className="equation-animator" role="region" aria-label="Equation Simplification Animation">
      {/* Problem Info */}
      <div className="animator-header">
        <h3 className="problem-title">
          {problem.topic} - Grade {problem.gradeLevel}
        </h3>
        <span className="difficulty-badge" aria-label={`Difficulty level ${problem.difficulty} out of 5`}>
          {'★'.repeat(problem.difficulty)}{'☆'.repeat(5 - problem.difficulty)}
        </span>
      </div>

      {/* Main Animation Area */}
      <div className="animation-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: config.transitionDuration / 1000,
              ease: config.easing,
            }}
            className="equation-display"
          >
            <EquationRenderer
              equation={currentStep.equation}
              displayMode={true}
              highlightElements={currentStep.changedElements}
              highlightColor={currentStep.highlightColor || config.highlightColor}
            />
          </motion.div>
        </AnimatePresence>

        {/* Step Description */}
        <motion.div
          className="step-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="description-text">{currentStep.description}</p>
          <p className="rule-text">
            <strong>Rule:</strong> {currentStep.rule}
          </p>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="animator-controls">
        <div className="playback-controls">
          <button
            onClick={reset}
            className="control-button"
            aria-label="Reset to first step"
            disabled={isFirstStep && !isPlaying}
          >
            ⏮️
          </button>
          <button
            onClick={previousStep}
            className="control-button"
            aria-label="Previous step"
            disabled={isFirstStep}
          >
            ⏪
          </button>
          <button
            onClick={togglePlay}
            className="control-button play-button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={nextStep}
            className="control-button"
            aria-label="Next step"
            disabled={isLastStep && !config.loop}
          >
            ⏩
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-info">
            <span>Step {currentStepIndex + 1} of {problem.steps.length}</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={problem.steps.length}>
            <div
              className="progress-fill"
              style={{
                width: `${((currentStepIndex + 1) / problem.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Speed Control */}
        <div className="speed-control">
          <label htmlFor="speed-select">Speed:</label>
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="speed-select"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts" role="note">
        <small>
          <strong>Shortcuts:</strong> Space (play/pause), ← → (navigate), R (reset)
        </small>
      </div>
    </div>
  );
};

export default EquationAnimator;
