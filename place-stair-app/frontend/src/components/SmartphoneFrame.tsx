import React from 'react';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="smartphone-container">
      <div className="smartphone-frame">
        {/* Phone hardware */}
        <div className="phone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* Status bar */}
        <div className="status-bar">
          <div className="status-left">
            <span className="time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="status-right">
            <span className="signal-icon">📶</span>
            <span className="wifi-icon">📡</span>
            <span className="battery-icon">🔋</span>
          </div>
        </div>

        {/* Screen content */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Home indicator */}
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
