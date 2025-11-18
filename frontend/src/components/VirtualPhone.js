import React from 'react';
import './VirtualPhone.css';

/**
 * 가상 스마트폰 UI 컴포넌트
 *
 * 우측 하단에 고정되어 표시되는 스마트폰 형태의 UI
 * Log Heat 시각화를 표시
 */
const VirtualPhone = ({ heatData, children }) => {
  return (
    <div className="virtual-phone-container">
      <div className="virtual-phone">
        {/* 스마트폰 노치 */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* 스마트폰 스크린 */}
        <div className="phone-screen">
          {/* 상태바 */}
          <div className="phone-status-bar">
            <div className="status-time">
              {new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="status-icons">
              <span className="status-icon">📶</span>
              <span className="status-icon">📡</span>
              <span className="status-icon">🔋</span>
            </div>
          </div>

          {/* 앱 제목 바 */}
          <div className="phone-header">
            <h2 className="phone-title">🔥 Log Heat</h2>
            {heatData && (
              <div className="heat-badge" style={{ backgroundColor: heatData.colorTemperature }}>
                {heatData.metadata?.heatLevel || 'N/A'}
              </div>
            )}
          </div>

          {/* 컨텐츠 영역 */}
          <div className="phone-content">
            {children}
          </div>

          {/* 홈 인디케이터 (iPhone 스타일) */}
          <div className="phone-home-indicator"></div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPhone;
