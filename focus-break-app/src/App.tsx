import { useState, useEffect, useRef } from 'react';
import { ConcentrationTracker } from './services/ConcentrationTracker';
import type { ConcentrationStatus, ConcentrationEvent } from './services/ConcentrationTracker';
import BreakMusicPlayer from './components/BreakMusicPlayer';
import './App.css';

function App() {
  const [concentrationStatus, setConcentrationStatus] = useState<ConcentrationStatus>('focused');
  const [isTracking, setIsTracking] = useState(false);
  const [focusTime, setFocusTime] = useState(0); // Total focus time in seconds
  const [currentSessionTime, setCurrentSessionTime] = useState(0); // Current session time
  const [breakCount, setBreakCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<ConcentrationEvent | null>(null);
  const [playBreakMusic, setPlayBreakMusic] = useState(false);

  const trackerRef = useRef<ConcentrationTracker | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize concentration tracker
  useEffect(() => {
    trackerRef.current = new ConcentrationTracker(30000); // 30 seconds idle threshold

    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
    };
  }, []);

  // Subscribe to concentration changes
  useEffect(() => {
    if (!trackerRef.current) return;

    const unsubscribe = trackerRef.current.subscribe((event: ConcentrationEvent) => {
      setLastEvent(event);
      setConcentrationStatus(event.status);

      // Play break music when concentration is broken
      if (event.status === 'break' || event.status === 'idle') {
        setPlayBreakMusic(true);
        setBreakCount(prev => prev + 1);
      } else if (event.status === 'focused') {
        setPlayBreakMusic(false);
      }
    });

    return unsubscribe;
  }, []);

  // Timer for tracking focus time
  useEffect(() => {
    if (isTracking && concentrationStatus === 'focused') {
      timerRef.current = window.setInterval(() => {
        setFocusTime(prev => prev + 1);
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (concentrationStatus !== 'focused') {
        setCurrentSessionTime(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, concentrationStatus]);

  const handleStartTracking = () => {
    if (trackerRef.current) {
      trackerRef.current.start();
      setIsTracking(true);
      setFocusTime(0);
      setBreakCount(0);
      setCurrentSessionTime(0);
    }
  };

  const handleStopTracking = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      setIsTracking(false);
      setPlayBreakMusic(false);
    }
  };

  const handleManualBreak = () => {
    if (trackerRef.current) {
      trackerRef.current.triggerBreak();
    }
  };

  const handleResumeFocus = () => {
    if (trackerRef.current) {
      trackerRef.current.resumeFocus();
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: ConcentrationStatus): string => {
    switch (status) {
      case 'focused': return '#10b981';
      case 'break': return '#f59e0b';
      case 'idle': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusEmoji = (status: ConcentrationStatus): string => {
    switch (status) {
      case 'focused': return '🎯';
      case 'break': return '☕';
      case 'idle': return '😴';
      default: return '⏸️';
    }
  };

  const getStatusText = (status: ConcentrationStatus): string => {
    switch (status) {
      case 'focused': return '집중 중';
      case 'break': return '휴식 중';
      case 'idle': return '대기 중';
      default: return '대기';
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎓 학습 집중도 모니터</h1>
          <p className="subtitle">LMS 통합 집중도 추적 및 휴식 음악 재생</p>
        </header>

        <div className="main-content">
          {/* Status Card */}
          <div
            className="status-card"
            style={{ borderColor: getStatusColor(concentrationStatus) }}
          >
            <div className="status-header">
              <span className="status-emoji">{getStatusEmoji(concentrationStatus)}</span>
              <div className="status-info">
                <h2 style={{ color: getStatusColor(concentrationStatus) }}>
                  {getStatusText(concentrationStatus)}
                </h2>
                {lastEvent && (
                  <p className="status-reason">{lastEvent.reason}</p>
                )}
              </div>
            </div>

            {/* Timer Display */}
            <div className="timer-display">
              <div className="timer-item">
                <div className="timer-label">총 집중 시간</div>
                <div className="timer-value">{formatTime(focusTime)}</div>
              </div>
              {isTracking && concentrationStatus === 'focused' && (
                <div className="timer-item">
                  <div className="timer-label">현재 세션</div>
                  <div className="timer-value session">{formatTime(currentSessionTime)}</div>
                </div>
              )}
              <div className="timer-item">
                <div className="timer-label">휴식 횟수</div>
                <div className="timer-value">{breakCount}</div>
              </div>
            </div>
          </div>

          {/* Break Music Player */}
          {playBreakMusic && (
            <div className="music-section">
              <BreakMusicPlayer
                isPlaying={playBreakMusic}
                volume={0.5}
              />
              <p className="music-description">
                잠깐 휴식을 취하세요. 편안한 음악이 재생됩니다 🎵
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="controls">
            {!isTracking ? (
              <button
                className="btn btn-primary btn-large"
                onClick={handleStartTracking}
              >
                🚀 추적 시작
              </button>
            ) : (
              <>
                <button
                  className="btn btn-danger"
                  onClick={handleStopTracking}
                >
                  ⏹️ 추적 중지
                </button>

                {concentrationStatus === 'focused' && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleManualBreak}
                  >
                    ☕ 수동 휴식
                  </button>
                )}

                {concentrationStatus !== 'focused' && (
                  <button
                    className="btn btn-success"
                    onClick={handleResumeFocus}
                  >
                    🎯 집중 재개
                  </button>
                )}
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="info-section">
            <h3>💡 작동 방식</h3>
            <ul className="info-list">
              <li>
                <strong>탭 전환 감지:</strong> 다른 탭으로 이동하면 자동으로 휴식 모드로 전환됩니다
              </li>
              <li>
                <strong>활동 추적:</strong> 30초 동안 마우스나 키보드 활동이 없으면 대기 상태로 전환됩니다
              </li>
              <li>
                <strong>휴식 음악:</strong> 집중이 깨지면 자동으로 편안한 음악이 재생됩니다
              </li>
              <li>
                <strong>통계 추적:</strong> 총 집중 시간과 휴식 횟수를 실시간으로 추적합니다
              </li>
            </ul>
          </div>
        </div>

        <footer className="footer">
          <p>KAIST Touch Math Academy - AI Education System</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
