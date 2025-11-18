import { useState, useEffect } from 'react';
import { BreathingAnimation } from './components/BreathingAnimation';
import { useBreathingStore } from './hooks/useBreathingStore';
import { BREATHING_PATTERNS } from './types/breathing';
import { lmsService } from './services/lmsService';
import './styles/App.css';

function App() {
  const {
    currentPattern,
    isActive,
    currentSession,
    setPattern,
    startSession,
    stopSession,
    incrementCycle,
  } = useBreathingStore();

  const [userId, setUserId] = useState('student-001');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 초기 인증 (개발 환경에서는 자동 인증)
    const initAuth = async () => {
      try {
        await lmsService.authenticate(userId, 'dev-token-123');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('인증 실패:', error);
      }
    };

    initAuth();
  }, [userId]);

  const handleStart = () => {
    startSession(userId);
  };

  const handleStop = () => {
    stopSession();
  };

  const handleCycleComplete = (cycleCount: number) => {
    console.log('사이클 완료:', cycleCount);
    incrementCycle();
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isActive) {
      setPattern(e.target.value);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>안정 호흡 가이드</h1>
        <p className="subtitle">스트레스 해소와 집중력 향상을 위한 호흡 연습</p>
        {isAuthenticated && (
          <div className="user-info">
            <span className="status-indicator">● </span>
            LMS 연결됨
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="control-panel">
          <div className="pattern-selector">
            <label htmlFor="pattern-select">호흡 패턴 선택:</label>
            <select
              id="pattern-select"
              value={Object.keys(BREATHING_PATTERNS).find(
                (key) => BREATHING_PATTERNS[key] === currentPattern
              )}
              onChange={handlePatternChange}
              disabled={isActive}
            >
              {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
                <option key={key} value={key}>
                  {pattern.name} - {pattern.description}
                </option>
              ))}
            </select>
          </div>

          <div className="pattern-details">
            <h3>현재 패턴: {currentPattern.name}</h3>
            <div className="timing-info">
              <div className="timing-item">
                <span className="timing-label">들이마시기:</span>
                <span className="timing-value">{currentPattern.inhale}초</span>
              </div>
              <div className="timing-item">
                <span className="timing-label">참기 (들임):</span>
                <span className="timing-value">{currentPattern.holdIn}초</span>
              </div>
              <div className="timing-item">
                <span className="timing-label">내쉬기:</span>
                <span className="timing-value">{currentPattern.exhale}초</span>
              </div>
              <div className="timing-item">
                <span className="timing-label">참기 (냄):</span>
                <span className="timing-value">{currentPattern.holdOut}초</span>
              </div>
            </div>
          </div>

          <div className="control-buttons">
            {!isActive ? (
              <button onClick={handleStart} className="btn btn-start">
                시작하기
              </button>
            ) : (
              <button onClick={handleStop} className="btn btn-stop">
                중지하기
              </button>
            )}
          </div>

          {currentSession && (
            <div className="session-info">
              <h4>현재 세션</h4>
              <p>시작 시간: {currentSession.startTime.toLocaleTimeString('ko-KR')}</p>
              <p>완료한 사이클: {currentSession.totalCycles}</p>
              <p>
                경과 시간:{' '}
                {Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000)}초
              </p>
            </div>
          )}
        </div>

        <div className="animation-container">
          <BreathingAnimation
            pattern={currentPattern}
            isActive={isActive}
            onCycleComplete={handleCycleComplete}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>매일 5-10분의 호흡 연습으로 마음의 평화를 찾으세요</p>
      </footer>
    </div>
  );
}

export default App;
