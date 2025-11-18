import React, { useState, useEffect } from 'react';
import VirtualPhone from './components/VirtualPhone';
import LogHeatDisplay from './components/LogHeatDisplay';
import apiService from './services/api';
import './App.css';

const UPDATE_INTERVAL = parseInt(
  process.env.REACT_APP_UPDATE_INTERVAL || '60000'
);

const DEFAULT_TIME_WINDOW = process.env.REACT_APP_DEFAULT_TIME_WINDOW || '1h';

function App() {
  const [heatData, setHeatData] = useState(null);
  const [timeWindow, setTimeWindow] = useState(DEFAULT_TIME_WINDOW);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 히트 데이터 가져오기
  const fetchHeatData = async () => {
    try {
      const response = await apiService.getHeat({
        timeWindow,
        calculate: 'true'
      });

      if (response.success && response.data) {
        setHeatData(response.data);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('히트 데이터 조회 실패:', err);
      setError('데이터를 가져오는데 실패했습니다.');
    }
  };

  // 서버 연결 확인
  const checkConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      setIsConnected(response.success);
    } catch (err) {
      setIsConnected(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    checkConnection();
    fetchHeatData();
  }, []);

  // 시간 윈도우 변경시 데이터 갱신
  useEffect(() => {
    fetchHeatData();
  }, [timeWindow]);

  // 자동 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHeatData();
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [timeWindow]);

  // 시간 윈도우 버튼
  const timeWindows = [
    { value: '1h', label: '1시간' },
    { value: '6h', label: '6시간' },
    { value: '24h', label: '24시간' },
    { value: '7d', label: '7일' }
  ];

  return (
    <div className="app">
      {/* 메인 대시보드 */}
      <div className="main-dashboard">
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            🔥 Log Heat
            <span className="subtitle">LMS Activity Visualization</span>
          </h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="info-card">
            <h2>📱 가상 스마트폰 UI</h2>
            <p>
              우측 하단의 스마트폰 화면에서 실시간 Log Heat를 확인하세요.
            </p>
            <p>
              로그 변화율이 색 온도로 표시됩니다:
            </p>
            <div className="color-guide">
              <div className="color-item">
                <div className="color-box" style={{ backgroundColor: '#0066FF' }}></div>
                <span>파란색 = 낮은 활동</span>
              </div>
              <div className="color-item">
                <div className="color-box" style={{ backgroundColor: '#00FF66' }}></div>
                <span>초록색 = 보통 활동</span>
              </div>
              <div className="color-item">
                <div className="color-box" style={{ backgroundColor: '#FFCC00' }}></div>
                <span>노란색 = 높은 활동</span>
              </div>
              <div className="color-item">
                <div className="color-box" style={{ backgroundColor: '#FF3300' }}></div>
                <span>빨간색 = 매우 높은 활동</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>⚙️ 설정</h2>
            <div className="time-window-selector">
              <label>시간 범위:</label>
              <div className="time-buttons">
                {timeWindows.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`time-button ${timeWindow === value ? 'active' : ''}`}
                    onClick={() => setTimeWindow(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {lastUpdate && (
              <div className="update-info">
                마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
              </div>
            )}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="info-card">
            <h2>📊 통계</h2>
            {heatData && (
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-value">{heatData.logCount}</div>
                  <div className="stat-label">로그 개수</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{Math.round(heatData.changeRate)}%</div>
                  <div className="stat-label">변화율</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{Math.round(heatData.heatScore)}</div>
                  <div className="stat-label">히트 스코어</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{heatData.metadata?.heatLevel}</div>
                  <div className="stat-label">활동 레벨</div>
                </div>
              </div>
            )}
          </div>

          <div className="info-card">
            <h2>ℹ️ 시스템 정보</h2>
            <ul className="info-list">
              <li>백엔드: Node.js + Express</li>
              <li>데이터베이스: PostgreSQL</li>
              <li>LMS 연동: Moodle REST API</li>
              <li>업데이트 간격: {UPDATE_INTERVAL / 1000}초</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 가상 스마트폰 (우측 하단 고정) */}
      <VirtualPhone heatData={heatData}>
        <LogHeatDisplay heatData={heatData} timeWindow={timeWindow} />
      </VirtualPhone>
    </div>
  );
}

export default App;
