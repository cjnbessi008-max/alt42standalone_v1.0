import { useState, useEffect } from 'react';
import VirtualSmartphone from './components/VirtualSmartphone';
import RecurrenceBeam from './components/RecurrenceBeam';
import ControlPanel from './components/ControlPanel';
import MoodleApiService from './services/moodleApi';
import { RecurrenceCalculator } from './utils/recurrenceCalculator';
import type { RecurrenceProblem, RecurrenceStep } from './types';
import './App.css';

/**
 * Main App Component
 * Recurrence Beam - Visualizing recurrence relations as animated light beams
 */
function App() {
  const [problems, setProblems] = useState<RecurrenceProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<RecurrenceProblem | null>(null);
  const [steps, setSteps] = useState<RecurrenceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(3);

  // Initialize Moodle API and load problems
  useEffect(() => {
    const moodleApi = new MoodleApiService({
      baseUrl: 'https://your-moodle-instance.com',
      token: 'your-token-here',
    });

    // Load sample problems (or fetch from Moodle if configured)
    const sampleProblems = moodleApi.getSampleProblems();
    setProblems(sampleProblems);

    // Auto-select first problem
    if (sampleProblems.length > 0) {
      setSelectedProblem(sampleProblems[0]);
    }
  }, []);

  // Calculate steps when problem changes
  useEffect(() => {
    if (selectedProblem) {
      const calculatedSteps = RecurrenceCalculator.calculateSteps(selectedProblem);
      setSteps(calculatedSteps);
      setCurrentStep(0);
      setIsAnimating(false);
    }
  }, [selectedProblem]);

  // Auto-advance animation
  useEffect(() => {
    let timer: number;

    if (isAnimating && currentStep < steps.length - 1) {
      const delay = Math.max(500, 2000 / speed);
      timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, delay);
    } else if (isAnimating && currentStep >= steps.length - 1) {
      setIsAnimating(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAnimating, currentStep, steps.length, speed]);

  const handleSelectProblem = (problem: RecurrenceProblem) => {
    setSelectedProblem(problem);
  };

  const handlePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsAnimating(true);
  };

  const handlePause = () => {
    setIsAnimating(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsAnimating(false);
  };

  const handleStepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsAnimating(false);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setIsAnimating(false);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  return (
    <div className="app">
      {/* Main Info Banner */}
      <div className="info-banner">
        <h1>🌟 Recurrence Beam Visualizer</h1>
        <p>점화식의 흐름을 한 줄의 빛으로 표현 - Moodle LMS 연동 지원</p>
      </div>

      {/* Virtual Smartphone Display (Bottom Right) */}
      <VirtualSmartphone>
        {selectedProblem ? (
          <RecurrenceBeam
            steps={steps}
            currentStep={currentStep}
            isAnimating={isAnimating}
            speed={speed}
          />
        ) : (
          <div className="placeholder">
            <p>문제를 선택하세요</p>
          </div>
        )}
      </VirtualSmartphone>

      {/* Desktop Control Panel (Left Side) */}
      <div className="desktop-controls">
        <ControlPanel
          problems={problems}
          selectedProblem={selectedProblem}
          onSelectProblem={handleSelectProblem}
          currentStep={currentStep}
          maxSteps={steps.length}
          isAnimating={isAnimating}
          speed={speed}
          onPlay={handlePlay}
          onPause={handlePause}
          onReset={handleReset}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onSpeedChange={handleSpeedChange}
        />
      </div>
    </div>
  );
}

export default App;
