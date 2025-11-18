import React, { useState } from 'react';
import {
  ProblemNavigator,
  MindfulnessSettings,
  useMindfulness,
  Problem,
} from '../src/components/mindfulness';

/**
 * 마인드풀니스 루틴 기능 데모
 *
 * 이 예제는 LMS에서 문제 전환 시 마인드풀니스 루틴을 통합하는 방법을 보여줍니다.
 */

// 샘플 문제 데이터
const sampleProblems: Problem[] = [
  {
    id: '1',
    type: 'math',
    content: {
      question: '분수 2/4를 간단히 하세요',
      answer: '1/2',
    },
    difficulty: 1,
  },
  {
    id: '2',
    type: 'math',
    content: {
      question: '1/3 + 1/6 = ?',
      answer: '1/2',
    },
    difficulty: 2,
  },
  {
    id: '3',
    type: 'math',
    content: {
      question: '3/4 × 2/3 = ?',
      answer: '1/2',
    },
    difficulty: 3,
  },
  {
    id: '4',
    type: 'math',
    content: {
      question: '5/8을 소수로 나타내세요',
      answer: '0.625',
    },
    difficulty: 2,
  },
  {
    id: '5',
    type: 'math',
    content: {
      question: '2 1/4 - 1 1/2 = ?',
      answer: '3/4',
    },
    difficulty: 3,
  },
];

// 문제 컴포넌트
const ProblemCard: React.FC<{ problem: Problem; onSubmit: (answer: string) => void }> = ({
  problem,
  onSubmit,
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answer);
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{
            background: '#667eea',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            난이도 {problem.difficulty}
          </span>
        </div>

        <h2 style={{
          fontSize: '24px',
          marginBottom: '32px',
          color: '#333',
        }}>
          {problem.content.question}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          />

          <button
            type="submit"
            style={{
              background: '#667eea',
              color: 'white',
              padding: '16px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            답안 제출
          </button>
        </form>
      </div>
    </div>
  );
};

// 메인 데모 컴포넌트
export const MindfulnessDemo: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [completed, setCompleted] = useState(false);

  const {
    config,
    updateConfig,
    resetToDefaults,
  } = useMindfulness({
    persistConfig: true,
    initialConfig: {
      enabled: true,
      routineType: 'breathing',
      duration: 30,
      frequency: 2, // 2문제마다 마인드풀니스 루틴
    },
  });

  const handleAnswerSubmit = (answer: string) => {
    console.log('Submitted answer:', answer);
    // 여기서 답안을 검증하고 다음 문제로 이동
    // 데모에서는 자동으로 다음 문제로 이동
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  if (completed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '40px',
      }}>
        <div>
          <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>🎉 완료!</h1>
          <p style={{ fontSize: '24px', marginBottom: '32px' }}>
            모든 문제를 풀었습니다. 수고하셨습니다!
          </p>
          <button
            onClick={() => {
              setCompleted(false);
              setCurrentIndex(0);
            }}
            style={{
              background: 'white',
              color: '#667eea',
              padding: '16px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            다시 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9ff 0%, #e8eeff 100%)',
    }}>
      {/* 헤더 */}
      <header style={{
        background: 'white',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '40px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{ margin: 0, color: '#667eea' }}>
            KAIST Touch Math Academy
          </h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: '#667eea',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {showSettings ? '문제로 돌아가기' : '⚙️ 마인드풀니스 설정'}
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main style={{ padding: '0 20px 40px' }}>
        {showSettings ? (
          <MindfulnessSettings
            config={config}
            onConfigChange={updateConfig}
            onReset={resetToDefaults}
          />
        ) : (
          <ProblemNavigator
            problems={sampleProblems}
            currentIndex={currentIndex}
            onNext={setCurrentIndex}
            onPrevious={setCurrentIndex}
            mindfulnessSettings={config}
            renderProblem={(problem) => (
              <ProblemCard
                problem={problem}
                onSubmit={handleAnswerSubmit}
              />
            )}
            onComplete={handleComplete}
          />
        )}
      </main>

      {/* 정보 패널 */}
      {!showSettings && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '300px',
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#667eea' }}>
            💡 팁
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
            {config.enabled
              ? `${config.frequency === 1 ? '매 문제마다' : `${config.frequency}문제마다`} 마인드풀니스 루틴이 표시됩니다.`
              : '마인드풀니스 루틴이 비활성화되어 있습니다.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MindfulnessDemo;
