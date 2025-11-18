import { useState, useEffect } from 'react';
import { VerticalNumberLine } from './components/NumberLine';
import { SmartphoneFrame } from './components/SmartphoneDisplay';
import type { NumberRange } from './components/NumberLine/types';
import './App.css';

// LMS Mock Data (Moodle 연동 시뮬레이션)
interface ProblemData {
  id: number;
  title: string;
  description: string;
  min: number;
  max: number;
  correctRange: NumberRange;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockLMSProblems: ProblemData[] = [
  {
    id: 1,
    title: '양수 범위 찾기',
    description: '수직선에서 0보다 크고 5보다 작거나 같은 범위를 선택하세요.',
    min: -10,
    max: 10,
    correctRange: { start: 0, end: 5 },
    difficulty: 'easy',
  },
  {
    id: 2,
    title: '음수 범위 이해하기',
    description: '-5부터 -2까지의 범위를 찾아보세요.',
    min: -10,
    max: 10,
    correctRange: { start: -5, end: -2 },
    difficulty: 'medium',
  },
  {
    id: 3,
    title: '대칭 범위 선택',
    description: '-3부터 3까지의 범위를 선택하세요.',
    min: -10,
    max: 10,
    correctRange: { start: -3, end: 3 },
    difficulty: 'medium',
  },
  {
    id: 4,
    title: '큰 범위 작업',
    description: '10부터 25까지의 범위를 찾으세요.',
    min: 0,
    max: 30,
    correctRange: { start: 10, end: 25 },
    difficulty: 'hard',
  },
];

function App() {
  const [currentProblem, setCurrentProblem] = useState<ProblemData>(mockLMSProblems[0]);
  const [selectedRange, setSelectedRange] = useState<NumberRange | undefined>(undefined);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Simulate LMS data fetching
  useEffect(() => {
    console.log('📚 LMS 연동 시뮬레이션: 문제 데이터 로딩...');
    console.log('🔗 Moodle API 엔드포인트: /mod/quiz/problem/1');
    console.log('📊 현재 문제:', currentProblem);
  }, [currentProblem]);

  const handleRangeSelect = (range: NumberRange) => {
    setSelectedRange(range);
    setAttempts(attempts + 1);

    // Check if answer is correct
    const correct =
      range.start === currentProblem.correctRange.start &&
      range.end === currentProblem.correctRange.end;

    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
      // Simulate sending result to LMS
      console.log('✅ 정답! LMS에 결과 전송 중...');
      console.log('📤 POST /mod/quiz/submit', {
        problemId: currentProblem.id,
        studentAnswer: range,
        isCorrect: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log('❌ 오답. 다시 시도해보세요!');
    }
  };

  const handleNextProblem = () => {
    const currentIndex = mockLMSProblems.findIndex((p) => p.id === currentProblem.id);
    const nextIndex = (currentIndex + 1) % mockLMSProblems.length;
    setCurrentProblem(mockLMSProblems[nextIndex]);
    setSelectedRange(undefined);
    setIsCorrect(null);
  };

  const handleReset = () => {
    setSelectedRange(undefined);
    setIsCorrect(null);
  };

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="main-content">
        <header className="app-header">
          <h1>🎓 수직선 학습 앱</h1>
          <div className="lms-badge">
            <span className="lms-icon">🔗</span>
            <span>Moodle LMS 연동</span>
          </div>
        </header>

        <div className="problem-section">
          <div className="problem-card">
            <div className="problem-header">
              <h2>문제 #{currentProblem.id}</h2>
              <span className={`difficulty-badge ${currentProblem.difficulty}`}>
                {currentProblem.difficulty === 'easy' && '🟢 쉬움'}
                {currentProblem.difficulty === 'medium' && '🟡 보통'}
                {currentProblem.difficulty === 'hard' && '🔴 어려움'}
              </span>
            </div>
            <h3>{currentProblem.title}</h3>
            <p className="problem-description">{currentProblem.description}</p>

            {selectedRange && (
              <div className={`answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <div>
                    <strong>✅ 정답입니다!</strong>
                    <p>선택한 범위: [{selectedRange.start}, {selectedRange.end}]</p>
                  </div>
                ) : (
                  <div>
                    <strong>❌ 다시 시도해보세요!</strong>
                    <p>선택한 범위: [{selectedRange.start}, {selectedRange.end}]</p>
                    <p>힌트: 정답은 [{currentProblem.correctRange.start}, {currentProblem.correctRange.end}] 범위입니다.</p>
                  </div>
                )}
              </div>
            )}

            <div className="problem-controls">
              <button onClick={handleReset} className="btn-secondary">
                🔄 초기화
              </button>
              <button onClick={handleNextProblem} className="btn-primary">
                ➡️ 다음 문제
              </button>
            </div>
          </div>

          <div className="stats-card">
            <h3>📊 학습 통계</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{score}</div>
                <div className="stat-label">정답 수</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{attempts}</div>
                <div className="stat-label">시도 횟수</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
                </div>
                <div className="stat-label">정답률</div>
              </div>
            </div>
          </div>
        </div>

        <div className="instructions">
          <h3>📱 사용 방법</h3>
          <ol>
            <li>우측 하단 스마트폰 화면의 수직선을 드래그하여 범위를 선택하세요</li>
            <li>선택한 범위가 문제의 조건을 만족하는지 확인하세요</li>
            <li>범위를 선택하면 Glow 효과가 나타납니다</li>
            <li>정답을 맞추면 다음 문제로 진행할 수 있습니다</li>
          </ol>
        </div>

        <div className="lms-info">
          <h3>🔗 LMS 연동 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>플랫폼:</strong> Moodle 3.7
            </div>
            <div className="info-item">
              <strong>PHP 버전:</strong> 7.1.9
            </div>
            <div className="info-item">
              <strong>MySQL:</strong> 5.7
            </div>
            <div className="info-item">
              <strong>연동 상태:</strong> <span className="status-active">✅ 활성</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smartphone Display - Bottom Right */}
      <SmartphoneFrame position="bottom-right" scale={0.85}>
        <div className="phone-app">
          <h4 className="phone-title">{currentProblem.title}</h4>
          <p className="phone-description">{currentProblem.description}</p>
          <VerticalNumberLine
            min={currentProblem.min}
            max={currentProblem.max}
            selectedRange={selectedRange}
            onRangeSelect={handleRangeSelect}
            showGlow={true}
            glowIntensity={1.2}
            tickInterval={1}
            height={400}
            width={180}
          />
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
