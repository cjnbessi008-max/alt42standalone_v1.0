import React, { useState, useEffect } from 'react';
import '../styles/StatusBar.css';

const StatusBar = ({ isActive, progress, currentSize, maxSize, mode }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const expansionPercentage = ((currentSize - 180) / (maxSize - 180)) * 100;

  const getModeIcon = () => {
    switch (mode) {
      case 'time-based': return '⏱️';
      case 'progress-based': return '📊';
      case 'hybrid': return '🔄';
      default: return '📱';
    }
  };

  const getModeText = () => {
    switch (mode) {
      case 'time-based': return '시간 기반';
      case 'progress-based': return '진행도 기반';
      case 'hybrid': return '하이브리드';
      default: return '모드';
    }
  };

  return (
    <div className={`status-bar ${isActive ? 'active' : ''}`}>
      <div className="status-item">
        <span className="status-icon">📱</span>
        <span className="status-label">상태:</span>
        <span className={`status-value ${isActive ? 'active-text' : ''}`}>
          {isActive ? '🟢 활성' : '⚪ 대기'}
        </span>
      </div>

      <div className="status-item">
        <span className="status-icon">{getModeIcon()}</span>
        <span className="status-label">모드:</span>
        <span className="status-value">{getModeText()}</span>
      </div>

      <div className="status-item">
        <span className="status-icon">⏰</span>
        <span className="status-label">경과 시간:</span>
        <span className="status-value">{formatTime(elapsedTime)}</span>
      </div>

      <div className="status-item">
        <span className="status-icon">📏</span>
        <span className="status-label">화면 크기:</span>
        <span className="status-value">{currentSize}px</span>
      </div>

      <div className="status-item">
        <span className="status-icon">📈</span>
        <span className="status-label">확장률:</span>
        <span className="status-value">{Math.round(expansionPercentage)}%</span>
      </div>

      <div className="status-item">
        <span className="status-icon">✅</span>
        <span className="status-label">진행도:</span>
        <span className="status-value">{Math.round(progress)}%</span>
      </div>

      {/* Visual Progress Bar */}
      <div className="status-progress">
        <div className="progress-track">
          <div
            className="progress-expansion"
            style={{ width: `${expansionPercentage}%` }}
          >
            <span className="progress-label">확장</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
