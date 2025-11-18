import React, { useState } from 'react';
import { ProblemFeedback } from '../components/feedback';
import { MiniCelebration } from '../components/celebrations';
import { DifficultyLevel } from '../types';

/**
 * Example: Mini Celebration for Easy Problems
 *
 * 이 예시는 LMS에서 쉬운 문제를 성공했을 때 미니 축하 효과를 보여줍니다.
 */

interface ExampleProblem {
  id: string;
  question: string;
  correctAnswer: string;
  difficulty: DifficultyLevel;
}

export const CelebrationExample: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<ExampleProblem>({
    id: '1',
    question: '1/2 + 1/4 = ?',
    correctAnswer: '3/4',
    difficulty: 2, // 쉬운 문제
  });

  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const problems: ExampleProblem[] = [
    {
      id: '1',
      question: '1/2 + 1/4 = ?',
      correctAnswer: '3/4',
      difficulty: 2,
    },
    {
      id: '2',
      question: '2/3 + 1/3 = ?',
      correctAnswer: '1',
      difficulty: 1,
    },
    {
      id: '3',
      question: '5/6 - 1/2 = ?',
      correctAnswer: '1/3',
      difficulty: 3,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = userAnswer.trim() === currentProblem.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setUserAnswer('');

    // Load next problem
    const currentIndex = problems.findIndex((p) => p.id === currentProblem.id);
    const nextIndex = (currentIndex + 1) % problems.length;
    setCurrentProblem(problems[nextIndex]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>분수 문제 풀기</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>{currentProblem.question}</h2>
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
          난이도: {currentProblem.difficulty}/5
          {currentProblem.difficulty <= 2 && (
            <span style={{ marginLeft: '0.5rem', color: '#4CAF50' }}>
              (쉬운 문제 - 축하 효과 있음)
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="답을 입력하세요 (예: 3/4)"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
              }}
              disabled={showFeedback}
            />
          </div>

          <button
            type="submit"
            disabled={!userAnswer.trim() || showFeedback}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: showFeedback ? 'not-allowed' : 'pointer',
              opacity: showFeedback ? 0.5 : 1,
            }}
          >
            제출하기
          </button>
        </form>
      </div>

      {/* Feedback with integrated celebration */}
      {showFeedback && (
        <ProblemFeedback
          isCorrect={isCorrect}
          difficultyLevel={currentProblem.difficulty}
          explanation={
            isCorrect
              ? `정답입니다! ${currentProblem.correctAnswer}가 맞습니다.`
              : `틀렸습니다. 정답은 ${currentProblem.correctAnswer}입니다.`
          }
          onNext={handleNext}
          showCelebration={true}
        />
      )}

      {/* Standalone celebration example */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: '#f5f5f5', borderRadius: '12px' }}>
        <h3>독립 실행 예시</h3>
        <p>ProblemFeedback 없이 MiniCelebration만 단독으로 사용할 수도 있습니다.</p>
        <StandaloneCelebrationDemo />
      </div>
    </div>
  );
};

/**
 * Standalone Mini Celebration Demo
 */
const StandaloneCelebrationDemo: React.FC = () => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShow(true)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        축하 효과 보기
      </button>

      <MiniCelebration
        show={show}
        onComplete={() => setShow(false)}
        duration={1500}
      />
    </div>
  );
};

export default CelebrationExample;
