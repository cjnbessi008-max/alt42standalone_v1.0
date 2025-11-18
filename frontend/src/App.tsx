/**
 * Main Application Component
 * LMS Hint System - Student Interface
 */
import { useState, useEffect } from 'react';
import { ProblemView } from './components/ProblemView';
import { HintPanel } from './components/HintPanel';
import { hintService } from './services/api';
import type { Problem, HintResponse, HintRequest } from './types';

// Mock problem data - in production, this would come from LMS
const MOCK_PROBLEM: Problem = {
  id: 'problem_1',
  title: '분수의 덧셈',
  description: `다음 분수 덧셈 문제를 풀어보세요:

1/4 + 1/3 = ?

풀이 과정을 단계별로 작성하고, 최종 답을 기약분수로 나타내세요.`,
  subject: 'mathematics',
  difficulty: 'intermediate',
  grade_level: '5학년',
};

// Mock student data - in production, this would come from LMS authentication
const MOCK_STUDENT_ID = 'student_12345';

function App() {
  const [studentWork, setStudentWork] = useState('');
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_HINT_LEVEL = 5;

  const handleRequestHint = async () => {
    setIsLoadingHint(true);
    setError(null);

    try {
      const nextLevel = currentHintLevel + 1;

      const request: HintRequest = {
        student_id: MOCK_STUDENT_ID,
        problem_id: MOCK_PROBLEM.id,
        problem_description: MOCK_PROBLEM.description,
        student_work: studentWork || undefined,
        previous_hints: hints.map((h) => h.hint_text),
        hint_level: nextLevel,
        subject: MOCK_PROBLEM.subject,
        grade_level: MOCK_PROBLEM.grade_level,
      };

      const response = await hintService.generateHint(request);

      setHints((prev) => [...prev, response]);
      setCurrentHintLevel(nextLevel);
    } catch (err) {
      console.error('Error generating hint:', err);
      setError('힌트를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleSubmit = async () => {
    if (!studentWork.trim()) {
      alert('풀이를 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // In production, this would submit to the backend
      // and validate the answer, then sync with LMS
      console.log('Submitting student work:', studentWork);

      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert('답안이 제출되었습니다!');

      // Reset for next problem
      // In production, would navigate to next problem or results page
    } catch (err) {
      console.error('Error submitting work:', err);
      setError('답안 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              학습 힌트 시스템
            </h1>
            <div className="text-sm text-gray-600">
              {MOCK_PROBLEM.subject} • {MOCK_PROBLEM.grade_level}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Problem View - 2/3 width */}
          <div className="lg:col-span-2">
            <ProblemView
              problem={MOCK_PROBLEM}
              studentWork={studentWork}
              onStudentWorkChange={setStudentWork}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Hint Panel - 1/3 width */}
          <div className="lg:col-span-1">
            <HintPanel
              hints={hints}
              currentLevel={currentHintLevel}
              maxLevel={MAX_HINT_LEVEL}
              onRequestHint={handleRequestHint}
              isLoading={isLoadingHint}
            />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            힌트 시스템에 대하여
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              이 시스템은 AI를 활용하여 학생들의 사고를 돕는 힌트를 제공합니다.
            </p>
            <p className="font-medium text-blue-600">
              중요: 힌트는 답을 직접 알려주지 않습니다. 대신 문제를 풀기 위한
              사고 방향을 안내합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>단계 1: 가장 미묘한 힌트 (개념 상기)</li>
              <li>단계 2: 문제 유형 식별</li>
              <li>단계 3: 일반적인 전략 제안</li>
              <li>단계 4: 구체적인 단계 제시</li>
              <li>단계 5: 유사한 예제 제공 (가장 직접적)</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            LMS Hint System v1.0 - Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
