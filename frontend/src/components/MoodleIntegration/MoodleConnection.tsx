/**
 * Moodle Connection Configuration Component
 *
 * Allows users to configure and test Moodle LMS connection
 */

import React, { useState, useEffect } from 'react';
import { moodleApi, MoodleConnectionStatus } from '../../services/moodleApi';
import './MoodleConnection.css';

interface MoodleConnectionProps {
  onConnectionSuccess?: () => void;
}

export const MoodleConnection: React.FC<MoodleConnectionProps> = ({
  onConnectionSuccess,
}) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [connectionStatus, setConnectionStatus] =
    useState<MoodleConnectionStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('moodle_base_url');
    const savedToken = localStorage.getItem('moodle_ws_token');

    if (savedUrl) setBaseUrl(savedUrl);
    if (savedToken) setToken(savedToken);
  }, []);

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      // Save to environment (would need backend to actually set env vars)
      // For now, we'll assume the backend reads from .env file
      localStorage.setItem('moodle_base_url', baseUrl);
      localStorage.setItem('moodle_ws_token', token);

      const status = await moodleApi.testConnection();
      setConnectionStatus(status);

      if (status.status === 'connected' && onConnectionSuccess) {
        onConnectionSuccess();
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: error.message || '연결 테스트 실패',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearConfiguration = () => {
    setBaseUrl('');
    setToken('');
    setConnectionStatus(null);
    localStorage.removeItem('moodle_base_url');
    localStorage.removeItem('moodle_ws_token');
  };

  const isFormValid = baseUrl.trim() !== '' && token.trim() !== '';

  return (
    <div className="moodle-connection">
      <div className="connection-header">
        <h2>🔗 Moodle LMS 연결 설정</h2>
        <p className="subtitle">
          Moodle 사이트의 Web Services API에 연결합니다
        </p>
      </div>

      <div className="connection-form">
        <div className="form-group">
          <label htmlFor="baseUrl">
            <strong>Moodle 사이트 URL</strong>
            <span className="required">*</span>
          </label>
          <input
            id="baseUrl"
            type="url"
            placeholder="https://moodle.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={isConnecting}
            className="form-input"
          />
          <span className="help-text">
            예: https://moodle.kaist.ac.kr (슬래시 없이)
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="token">
            <strong>Web Service Token</strong>
            <span className="required">*</span>
          </label>
          <div className="token-input-group">
            <input
              id="token"
              type={showToken ? 'text' : 'password'}
              placeholder="토큰을 입력하세요"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isConnecting}
              className="form-input"
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowToken(!showToken)}
              disabled={isConnecting}
            >
              {showToken ? '👁️ 숨기기' : '👁️‍🗨️ 보기'}
            </button>
          </div>
          <span className="help-text">
            Moodle: 사이트 관리 → 서버 → 웹 서비스 → 토큰 관리
          </span>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={handleTestConnection}
            disabled={!isFormValid || isConnecting}
          >
            {isConnecting ? '연결 중...' : '🔌 연결 테스트'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleClearConfiguration}
            disabled={isConnecting}
          >
            🗑️ 설정 초기화
          </button>
        </div>

        {connectionStatus && (
          <div
            className={`connection-status status-${connectionStatus.status}`}
          >
            <div className="status-icon">
              {connectionStatus.status === 'connected' && '✅'}
              {connectionStatus.status === 'disconnected' && '⚠️'}
              {connectionStatus.status === 'error' && '❌'}
            </div>
            <div className="status-message">
              <strong>
                {connectionStatus.status === 'connected' && '연결 성공'}
                {connectionStatus.status === 'disconnected' && '연결 끊김'}
                {connectionStatus.status === 'error' && '연결 실패'}
              </strong>
              <p>{connectionStatus.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="connection-guide">
        <h3>📚 설정 가이드</h3>
        <ol>
          <li>
            <strong>Web Services 활성화:</strong>
            <br />
            사이트 관리 → 고급 기능 → "웹 서비스 활성화" 체크
          </li>
          <li>
            <strong>서비스 생성:</strong>
            <br />
            사이트 관리 → 서버 → 웹 서비스 → 외부 서비스 → 추가
          </li>
          <li>
            <strong>필요한 함수 추가:</strong>
            <br />
            <code>mod_quiz_get_quiz_structure</code>,{' '}
            <code>core_question_get_question_data</code>
          </li>
          <li>
            <strong>토큰 생성:</strong>
            <br />
            사이트 관리 → 서버 → 웹 서비스 → 토큰 관리 → 추가
          </li>
        </ol>
        <p className="guide-note">
          ℹ️ 자세한 설정 방법은{' '}
          <a
            href="/docs/MOODLE_INTEGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            문서
          </a>
          를 참조하세요.
        </p>
      </div>
    </div>
  );
};
