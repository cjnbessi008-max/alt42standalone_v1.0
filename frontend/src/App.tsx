import React, { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame/SmartphoneFrame';
import { TermMotionPlayer } from './components/TermMotion/TermMotionPlayer';
import { MathParser } from './utils/mathParser';
import { AnimationStep, Problem } from './types/math';
import { moodleApi } from './services/moodleApi';
import './index.css';

/**
 * Main App Component
 * 메인 앱 컴포넌트
 */
function App() {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial problem
  useEffect(() => {
    loadDemoProblem();
  }, []);

  /**
   * Load a demo problem for testing
   * 테스트용 데모 문제 로드
   */
  const loadDemoProblem = () => {
    setIsLoading(true);
    try {
      // Create demo animation steps
      const step1Expression = MathParser.parseExpression('2x + 3x + 5');
      const step2Expression = MathParser.parseExpression('5x + 5');

      const demoSteps: AnimationStep[] = [
        {
          id: 'step1',
          description: 'Initial expression',
          descriptionKo: '초기 수식',
          fromExpression: step1Expression,
          toExpression: step1Expression,
          termMappings: [],
          duration: 2,
        },
        {
          id: 'step2',
          description: 'Combine like terms: 2x + 3x = 5x',
          descriptionKo: '동류항 결합하기: 2x + 3x = 5x',
          fromExpression: step1Expression,
          toExpression: step2Expression,
          termMappings: [
            {
              fromTermId: step1Expression.terms[0].id,
              toTermId: step2Expression.terms[0].id,
              action: 'combine',
              color: '#3b82f6',
            },
            {
              fromTermId: step1Expression.terms[1].id,
              toTermId: step2Expression.terms[0].id,
              action: 'combine',
              color: '#3b82f6',
            },
          ],
          duration: 3,
        },
        {
          id: 'step3',
          description: 'Final simplified expression',
          descriptionKo: '최종 간소화된 수식',
          fromExpression: step2Expression,
          toExpression: step2Expression,
          termMappings: [],
          duration: 2,
        },
      ];

      const demoProblem: Problem = {
        id: 1,
        title: 'Combining Like Terms',
        description: 'Learn how to combine like terms in algebraic expressions',
        initialExpression: '2x + 3x + 5',
        targetExpression: '5x + 5',
        steps: demoSteps,
        difficulty: 'easy',
        category: 'algebra',
      };

      setCurrentProblem(demoProblem);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load demo problem');
      setIsLoading(false);
    }
  };

  /**
   * Handle animation completion
   */
  const handleAnimationComplete = () => {
    console.log('Animation completed!');
    // Here you would typically:
    // 1. Update progress in Moodle
    // 2. Show completion message
    // 3. Load next problem
  };

  /**
   * Handle step change
   */
  const handleStepChange = (step: number) => {
    console.log('Current step:', step);
    // Update progress tracking
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kaist-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProblem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error || 'No problem loaded'}</p>
          <button
            onClick={loadDemoProblem}
            className="mt-4 px-6 py-2 bg-kaist-blue text-white rounded-lg hover:bg-kaist-navy transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Desktop view */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-kaist-blue mb-2">
              Term Motion
            </h1>
            <p className="text-gray-600">
              Interactive Mathematical Expression Learning
            </p>
          </header>

          {/* Problem Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-2">{currentProblem.title}</h2>
            <p className="text-gray-600 mb-4">{currentProblem.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {currentProblem.difficulty}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                {currentProblem.category}
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Animation Player */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <TermMotionPlayer
                steps={currentProblem.steps}
                autoPlay={false}
                onComplete={handleAnimationComplete}
                onStepChange={handleStepChange}
              />
            </div>

            {/* Smartphone Preview */}
            <div className="flex items-center justify-center">
              <SmartphoneFrame position="center">
                <div className="px-4 py-6">
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {currentProblem.title}
                  </h3>
                  <TermMotionPlayer
                    steps={currentProblem.steps}
                    autoPlay={false}
                    onComplete={handleAnimationComplete}
                    onStepChange={handleStepChange}
                  />
                </div>
              </SmartphoneFrame>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden">
        <SmartphoneFrame position="center">
          <div className="px-4 py-6">
            <h3 className="text-xl font-semibold mb-2 text-center">
              {currentProblem.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              {currentProblem.description}
            </p>
            <TermMotionPlayer
              steps={currentProblem.steps}
              autoPlay={false}
              onComplete={handleAnimationComplete}
              onStepChange={handleStepChange}
            />
          </div>
        </SmartphoneFrame>
      </div>
    </div>
  );
}

export default App;
