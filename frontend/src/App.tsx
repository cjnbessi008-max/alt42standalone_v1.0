import { useState, useEffect } from 'react';
import SmartphoneViewport from './components/SmartphoneViewport/SmartphoneViewport';
import ConditionDoors from './components/ConditionDoors/ConditionDoors';
import { problemService } from './services/api';
import { Problem } from './types';
import './App.css';

function App() {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // 초기 문제 로드
  useEffect(() => {
    loadRandomProblem();
  }, []);

  const loadRandomProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      const problem = await problemService.getRandomProblem();
      setCurrentProblem(problem);
    } catch (err) {
      setError('문제를 불러오는데 실패했습니다. 서버를 확인해주세요.');
      console.error('Failed to load problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (
    conditionType: 'necessary' | 'sufficient',
    isCorrect: boolean
  ) => {
    if (!currentProblem) return;

    // 점수 업데이트
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // 백엔드에 답안 제출
    try {
      await problemService.submitAnswer(currentProblem.id, {
        conditionType,
        isCorrect,
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleNextProblem = () => {
    loadRandomProblem();
  };

  return (
    <div className="app">
      {/* 메인 영역: 정보 표시 */}
      <div className="main-content">
        <header className="app-header">
          <h1>Condition Doors</h1>
          <p className="subtitle">필요조건과 충분조건을 문의 개폐로 배우는 학습 앱</p>
        </header>

        <div className="info-section">
          <div className="score-card">
            <h2>점수</h2>
            <p className="score">
              {score.correct} / {score.total}
            </p>
            <p className="accuracy">
              {score.total > 0
                ? `정확도: ${((score.correct / score.total) * 100).toFixed(1)}%`
                : '문제를 풀어보세요!'}
            </p>
          </div>

          <div className="instructions-card">
            <h2>게임 방법</h2>
            <ol>
              <li>주어진 전제(P)와 결론(Q)을 확인하세요</li>
              <li>P와 Q의 관계를 생각해보세요</li>
              <li>올바른 조건의 문을 선택하세요</li>
              <li>문이 열리면 정답 여부를 확인할 수 있습니다</li>
            </ol>

            <div className="concept-box">
              <h3>개념 정리</h3>
              <ul>
                <li>
                  <strong>필요조건:</strong> Q이면 P (Q → P)
                  <br />
                  <span className="example">예: "비가 온다" → "구름이 있다"</span>
                </li>
                <li>
                  <strong>충분조건:</strong> P이면 Q (P → Q)
                  <br />
                  <span className="example">예: "눈이 온다" → "춥다"</span>
                </li>
              </ul>
            </div>

            {currentProblem && (
              <button className="next-button" onClick={handleNextProblem}>
                다음 문제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 우측 하단: 가상 스마트폰 */}
      <SmartphoneViewport position="bottom-right">
        {loading ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>문제 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-screen">
            <p className="error-message">{error}</p>
            <button onClick={loadRandomProblem}>다시 시도</button>
          </div>
        ) : currentProblem ? (
          <ConditionDoors problem={currentProblem} onAnswer={handleAnswer} />
        ) : (
          <div className="empty-screen">
            <p>문제가 없습니다</p>
          </div>
        )}
      </SmartphoneViewport>
    </div>
  );
}

export default App;
