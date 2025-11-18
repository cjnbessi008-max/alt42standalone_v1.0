/**
 * FeedbackDemo - Example usage of EmpatheticFeedback component
 *
 * This demonstrates how to integrate empathetic feedback into your LMS
 */

import React, { useState } from 'react';
import EmpatheticFeedback, { ToastFeedback, CompactFeedback } from './EmpatheticFeedback';
import { FeedbackType, Language } from '../lib/empathetic-feedback';

/**
 * Example 1: Quiz/Problem Solving Interface
 */
export const QuizExample: React.FC = () => {
  const [answer, setAnswer] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const correctAnswer = '8';

  const handleSubmit = () => {
    setAttemptCount(attemptCount + 1);
    const correct = answer.trim() === correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Auto-hide feedback after 5 seconds
    setTimeout(() => setShowFeedback(false), 5000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">분수 문제 풀기</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <p className="text-lg mb-4">3 + 5 = ?</p>

        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="border-2 rounded px-4 py-2 w-32 text-lg"
          placeholder="답을 입력하세요"
        />

        <button
          onClick={handleSubmit}
          className="ml-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          제출하기
        </button>
      </div>

      {showFeedback && (
        <EmpatheticFeedback
          isCorrect={isCorrect}
          attemptNumber={attemptCount}
          language="ko"
          context={{
            totalProblemsToday: 7,
            recentSuccessRate: 0.8,
          }}
          visible={showFeedback}
        />
      )}

      <div className="text-sm text-gray-600 mt-4">
        <p>시도 횟수: {attemptCount}</p>
        <p className="text-xs mt-2">힌트: 정답은 8입니다 😊</p>
      </div>
    </div>
  );
};

/**
 * Example 2: All Feedback Types Showcase
 */
export const FeedbackShowcase: React.FC = () => {
  const [selectedType, setSelectedType] = useState<FeedbackType>('correct');
  const [language, setLanguage] = useState<Language>('ko');

  const feedbackTypes: FeedbackType[] = ['correct', 'wrong', 'partial', 'encouragement'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">공감형 피드백 메시지 쇼케이스</h2>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">피드백 타입:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as FeedbackType)}
            className="border-2 rounded px-4 py-2"
          >
            {feedbackTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">언어:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="border-2 rounded px-4 py-2">
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Standard Feedback:</h3>
          <EmpatheticFeedback type={selectedType} language={language} context={{ studentName: '지민' }} />
        </div>

        <div>
          <h3 className="font-semibold mb-2">Compact Feedback:</h3>
          <CompactFeedback type={selectedType} language={language} />
        </div>
      </div>
    </div>
  );
};

/**
 * Example 3: Real-time Practice with Toast Notifications
 */
export const PracticeSession: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [isCorrect, setIsCorrect] = useState(true);

  const simulateAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    setShowToast(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">실시간 연습 세션</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg mb-4">버튼을 눌러 피드백을 확인하세요:</p>

        <div className="flex gap-4">
          <button
            onClick={() => simulateAnswer(true)}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
          >
            정답 시뮬레이션 ✓
          </button>

          <button
            onClick={() => simulateAnswer(false)}
            className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600"
          >
            오답 시뮬레이션 ✗
          </button>
        </div>
      </div>

      {showToast && (
        <ToastFeedback
          isCorrect={isCorrect}
          language="ko"
          visible={showToast}
          autoHideDuration={4000}
          onHide={() => setShowToast(false)}
          context={{
            totalProblemsToday: 12,
            recentSuccessRate: 0.75,
          }}
        />
      )}
    </div>
  );
};

/**
 * Example 4: Integration with LMS API
 */
export const LMSIntegrationExample: React.FC = () => {
  const [feedback, setFeedback] = useState<{ show: boolean; isCorrect: boolean; attempts: number }>({
    show: false,
    isCorrect: false,
    attempts: 0,
  });

  // Simulate API call to submit answer
  const submitAnswerToLMS = async (studentAnswer: string) => {
    // In real implementation, this would be an API call
    const response = await mockLMSAPI(studentAnswer);

    setFeedback({
      show: true,
      isCorrect: response.isCorrect,
      attempts: response.attemptNumber,
    });

    // Log analytics
    console.log('Answer submitted:', {
      answer: studentAnswer,
      correct: response.isCorrect,
      attempts: response.attemptNumber,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">LMS API 연동 예시</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <p className="text-lg mb-4">2 × 4 = ?</p>

        <button
          onClick={() => submitAnswerToLMS('8')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-2"
        >
          정답 제출 (8)
        </button>

        <button
          onClick={() => submitAnswerToLMS('6')}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          오답 제출 (6)
        </button>
      </div>

      {feedback.show && (
        <EmpatheticFeedback
          isCorrect={feedback.isCorrect}
          attemptNumber={feedback.attempts}
          language="ko"
          context={{
            totalProblemsToday: 5,
            recentSuccessRate: 0.9,
            studentName: '수진',
          }}
          visible={feedback.show}
          autoHideDuration={6000}
          onHide={() => setFeedback({ ...feedback, show: false })}
        />
      )}

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">API Response Structure:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              isCorrect: true,
              attemptNumber: 1,
              studentId: 'student_123',
              problemId: 'problem_456',
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

/**
 * Mock LMS API for demonstration
 */
async function mockLMSAPI(answer: string): Promise<{ isCorrect: boolean; attemptNumber: number }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    isCorrect: answer === '8',
    attemptNumber: Math.floor(Math.random() * 3) + 1,
  };
}

/**
 * Main Demo Page
 */
export const FeedbackDemoPage: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('quiz');

  const examples = [
    { id: 'quiz', label: '퀴즈 예시', component: QuizExample },
    { id: 'showcase', label: '쇼케이스', component: FeedbackShowcase },
    { id: 'practice', label: '연습 세션', component: PracticeSession },
    { id: 'lms', label: 'LMS 연동', component: LMSIntegrationExample },
  ];

  const ActiveComponent = examples.find((ex) => ex.id === activeExample)?.component || QuizExample;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">공감형 피드백 시스템 데모</h1>
          <p className="text-gray-600">오답 시 압박 대신 공감과 응원으로</p>
        </header>

        {/* Navigation */}
        <nav className="mb-8 flex justify-center gap-2">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              className={`
                px-4 py-2 rounded
                ${activeExample === example.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
              `}
            >
              {example.label}
            </button>
          ))}
        </nav>

        {/* Active Example */}
        <main>
          <ActiveComponent />
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>이 컴포넌트는 학생들에게 긍정적이고 격려하는 학습 경험을 제공합니다.</p>
          <p className="mt-2">
            <a href="https://github.com" className="text-blue-500 hover:underline">
              GitHub에서 코드 보기
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default FeedbackDemoPage;
