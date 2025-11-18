import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationStep } from '@/types/math';
import { ExpressionDisplay } from '../MathExpression/ExpressionDisplay';
import { Play, Pause, RotateCcw, SkipForward, SkipBack } from 'lucide-react';

interface TermMotionPlayerProps {
  steps: AnimationStep[];
  autoPlay?: boolean;
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

/**
 * Term Motion Animation Player
 * 단항 움직임 애니메이션 플레이어
 */
export const TermMotionPlayer: React.FC<TermMotionPlayerProps> = ({
  steps,
  autoPlay = false,
  onComplete,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [highlightedTerms, setHighlightedTerms] = useState<string[]>([]);

  const totalSteps = steps.length;
  const step = steps[currentStep];

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || !step) return;

    const timer = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        nextStep();
      } else {
        setIsPlaying(false);
        onComplete?.();
      }
    }, step.duration * 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, step, totalSteps]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);

      // Highlight terms being moved
      const newStep = steps[currentStep + 1];
      const termsToHighlight = newStep.termMappings.map(m => m.fromTermId);
      setHighlightedTerms(termsToHighlight);

      // Clear highlights after animation
      setTimeout(() => setHighlightedTerms([]), 1000);
    }
  }, [currentStep, totalSteps, steps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedTerms([]);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  if (!step) {
    return (
      <div className="text-center text-gray-500 p-8">
        No animation steps available
      </div>
    );
  }

  // Determine which expression to show
  const currentExpression = isPlaying && currentStep < totalSteps - 1
    ? step.toExpression
    : step.fromExpression;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Step Description */}
      <motion.div
        className="bg-gradient-to-r from-kaist-blue to-kaist-navy text-white p-4 rounded-lg shadow-md"
        key={`desc-${currentStep}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Step {currentStep + 1} of {totalSteps}
            </h3>
            <p className="text-sm opacity-90">{step.descriptionKo}</p>
            <p className="text-xs opacity-75 mt-1">{step.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Expression Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`expr-${currentStep}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <ExpressionDisplay
            expression={currentExpression}
            highlightedTermIds={highlightedTerms}
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{Math.round((currentStep / (totalSteps - 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-kaist-blue h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentStep === 0}
          aria-label="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={prevStep}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentStep === 0}
          aria-label="Previous step"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlay}
          className="p-4 rounded-full bg-kaist-blue text-white hover:bg-kaist-navy transition-colors shadow-lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={nextStep}
          className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentStep === totalSteps - 1}
          aria-label="Next step"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="ml-4 px-4 py-2 bg-gray-100 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
};
