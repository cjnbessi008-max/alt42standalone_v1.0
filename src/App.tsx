import React, { useState, useEffect } from 'react';
import SmartphoneSimulator from './components/SmartphoneSimulator';
import LogPropertyViewer from './components/LogPropertyViewer';
import lmsApi from './services/lmsApi';
import { LogProperty } from './types';
import { logProperties } from './data/logProperties';
import './styles/FlipCard.css';
import './styles/Smartphone.css';

/**
 * Property Flip App
 * 로그 성질을 카드 뒤집기 방식으로 학습하는 독립형 웹앱
 */
function App() {
  const [currentProperties, setCurrentProperties] = useState<LogProperty[]>(logProperties);
  const [lmsConnected, setLmsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // LMS 연결 시도
  useEffect(() => {
    checkLMSConnection();
  }, []);

  const checkLMSConnection = async () => {
    // LMS 토큰이 URL 파라미터에 있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('wstoken');

    if (token) {
      lmsApi.setToken(token);
      const isConnected = await lmsApi.testConnection();
      setLmsConnected(isConnected);

      if (isConnected) {
        loadProblemsFromLMS();
      }
    }
  };

  const loadProblemsFromLMS = async () => {
    setIsLoading(true);
    try {
      const response = await lmsApi.fetchMockProblemData();
      if (response.success && response.data) {
        // LMS에서 받은 문제가 있으면 사용, 없으면 기본 데이터 사용
        if (response.data.properties.length > 0) {
          setCurrentProperties(response.data.properties);
        }
      }
    } catch (error) {
      console.error('Failed to load problems from LMS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <SmartphoneSimulator lmsConnected={lmsConnected}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '16px',
            color: '#666'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              문제 불러오는 중...
            </div>
          </div>
        ) : (
          <LogPropertyViewer
            properties={currentProperties}
            autoPlayInterval={5000}
          />
        )}
      </SmartphoneSimulator>

      {/* 데스크톱 뷰 - 정보 패널 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        maxWidth: '400px',
        padding: '20px',
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          margin: '0 0 15px 0',
          fontSize: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📐 Property Flip
        </h1>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          로그 성질을 카드 뒤집기 방식으로 학습하세요!
        </p>
        <div style={{
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#555'
        }}>
          <strong>💡 사용 방법:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>우측 하단 스마트폰 화면을 확인하세요</li>
            <li>카드를 클릭하여 뒤집기</li>
            <li>이전/다음 버튼으로 카드 이동</li>
            <li>자동 버튼으로 자동 재생</li>
          </ul>
        </div>

        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: lmsConnected ? '#e8f5e9' : '#fff3e0',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <strong>🔗 LMS 연동:</strong>
          <div style={{ marginTop: '8px' }}>
            {lmsConnected ? (
              <span style={{ color: '#2e7d32' }}>✅ Moodle 연결됨</span>
            ) : (
              <span style={{ color: '#f57c00' }}>⚠️ 오프라인 모드</span>
            )}
          </div>
          {!lmsConnected && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              URL에 ?wstoken=YOUR_TOKEN 추가하여 연결
            </div>
          )}
        </div>

        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#1565c0'
        }}>
          <strong>📊 학습 현황:</strong>
          <div style={{ marginTop: '8px' }}>
            총 {currentProperties.length}개 성질
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
