import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConversionStep, BaseType } from '../types';
import { generateConversionSteps, getBaseName } from '../utils/baseConversion';
import './BaseSwitchAnimation.css';

interface BaseSwitchAnimationProps {
  sourceValue: string;
  sourceBase: BaseType;
  targetBase: BaseType;
  autoPlay?: boolean;
  speed?: number;
  onComplete?: () => void;
}

/**
 * Base Switch 애니메이션 컴포넌트
 * 진법 변환 과정을 단계별로 애니메이션으로 표시
 */
export default function BaseSwitchAnimation({
  sourceValue,
  sourceBase,
  targetBase,
  autoPlay = true,
  speed = 2000,
  onComplete,
}: BaseSwitchAnimationProps) {
  const [steps, setSteps] = useState<ConversionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // 초기 변환 단계 생성
  useEffect(() => {
    const conversionSteps = generateConversionSteps(sourceValue, sourceBase, targetBase);
    setSteps(conversionSteps);
    setCurrentStep(0);
  }, [sourceValue, sourceBase, targetBase]);

  // 자동 재생
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;

    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      // 애니메이션 완료
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentStep, isPlaying, steps.length, speed, onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  if (steps.length === 0) {
    return <div className="base-switch-loading">변환 준비 중...</div>;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="base-switch-container">
      {/* 헤더 */}
      <div className="base-switch-header">
        <h2 className="base-switch-title">Base Switch 진법 변환</h2>
        <div className="conversion-info">
          <span className="base-badge source">{getBaseName(sourceBase)}</span>
          <span className="arrow">→</span>
          <span className="base-badge target">{getBaseName(targetBase)}</span>
        </div>
      </div>

      {/* 진행 표시 */}
      <div className="progress-container">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="step-indicator">
          Step {currentStep + 1} / {steps.length}
        </div>
      </div>

      {/* 애니메이션 영역 */}
      <div className="animation-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="step-content"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            {/* 단계 설명 */}
            <div className="step-description">
              <h3>{currentStepData.description}</h3>
            </div>

            {/* 값 표시 */}
            <div className="value-display">
              <motion.div
                className="value-box"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="value-label">{getBaseName(currentStepData.base)}</div>
                <div className="value-text">{currentStepData.value}</div>
              </motion.div>
            </div>

            {/* 수식 표시 */}
            {currentStepData.formula && (
              <motion.div
                className="formula-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="formula-label">계산 과정:</div>
                <div className="formula-text">{currentStepData.formula}</div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="controls">
        <button
          className="control-btn"
          onClick={handleReset}
          disabled={currentStep === 0}
          title="처음으로"
        >
          ⏮️
        </button>
        <button
          className="control-btn"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          title="이전"
        >
          ◀️
        </button>
        <button
          className="control-btn play-pause"
          onClick={handlePlayPause}
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          className="control-btn"
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          title="다음"
        >
          ▶️
        </button>
      </div>

      {/* 단계 네비게이션 */}
      <div className="step-navigation">
        {steps.map((step, index) => (
          <button
            key={step.id}
            className={`step-dot ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
            onClick={() => setCurrentStep(index)}
            title={step.description}
          />
        ))}
      </div>
    </div>
  );
}
