import React, { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import AccumulationTower from './components/AccumulationTower';
import socketService from './services/socketService';

/**
 * 메인 App 컴포넌트
 */
function App() {
  // 사용자 및 코스 설정 (실제 환경에서는 URL 파라미터나 설정에서 가져옴)
  const [userId, setUserId] = useState(2); // 예시 사용자 ID
  const [courseId, setCourseId] = useState(1); // 예시 코스 ID
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');

  // 타워 데이터 상태
  const [towerData, setTowerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * 초기 설정 및 소켓 연결
   */
  useEffect(() => {
    // URL 파라미터에서 설정 읽기 (선택사항)
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId');
    const urlCourseId = params.get('courseId');
    const urlServerUrl = params.get('serverUrl');

    if (urlUserId) setUserId(parseInt(urlUserId));
    if (urlCourseId) setCourseId(parseInt(urlCourseId));
    if (urlServerUrl) setServerUrl(urlServerUrl);

    // 소켓 연결
    socketService.connect(serverUrl);

    // 이벤트 리스너 등록
    socketService.on('connected', handleSocketConnected);
    socketService.on('disconnected', handleSocketDisconnected);
    socketService.on('tower-update', handleTowerUpdate);
    socketService.on('error', handleSocketError);

    // 정리 함수
    return () => {
      socketService.off('connected', handleSocketConnected);
      socketService.off('disconnected', handleSocketDisconnected);
      socketService.off('tower-update', handleTowerUpdate);
      socketService.off('error', handleSocketError);
      socketService.disconnect();
    };
  }, []);

  /**
   * 사용자/코스 변경 시 구독 업데이트
   */
  useEffect(() => {
    if (socketService.getConnectionStatus() && userId && courseId) {
      setIsLoading(true);
      setError(null);
      socketService.subscribe(userId, courseId);
    }
  }, [userId, courseId]);

  /**
   * 소켓 연결 성공 핸들러
   */
  const handleSocketConnected = () => {
    console.log('Connected to server');
    setError(null);
    if (userId && courseId) {
      socketService.subscribe(userId, courseId);
    }
  };

  /**
   * 소켓 연결 해제 핸들러
   */
  const handleSocketDisconnected = () => {
    console.log('Disconnected from server');
    setError('서버와의 연결이 끊어졌습니다. 재연결 중...');
  };

  /**
   * 타워 업데이트 핸들러
   */
  const handleTowerUpdate = (data) => {
    console.log('Tower data updated:', data);
    setTowerData(data);
    setIsLoading(false);
    setError(null);
  };

  /**
   * 소켓 에러 핸들러
   */
  const handleSocketError = (error) => {
    console.error('Socket error:', error);
    setError(error.message || '서버 오류가 발생했습니다');
    setIsLoading(false);
  };

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = () => {
    socketService.refresh();
  };

  /**
   * 설정 저장
   */
  const handleSaveSettings = () => {
    setShowSettings(false);
    socketService.disconnect();
    socketService.connect(serverUrl);
  };

  return (
    <div className="App">
      {/* 설정 패널 (선택사항) */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          minWidth: '300px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>설정</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              사용자 ID:
            </label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              코스 ID:
            </label>
            <input
              type="number"
              value={courseId}
              onChange={(e) => setCourseId(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              서버 URL:
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveSettings}
              style={{
                flex: 1,
                padding: '10px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              저장
            </button>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ccc',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 설정 버튼 */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          fontSize: '24px',
          zIndex: 999
        }}
        title="설정"
      >
        ⚙️
      </button>

      {/* 스마트폰 프레임 */}
      <SmartphoneFrame>
        <AccumulationTower
          towerData={towerData}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
        />
      </SmartphoneFrame>
    </div>
  );
}

export default App;
