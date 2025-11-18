import React from 'react';
import './PhoneFrame.css';

/**
 * 가상 스마트폰 프레임 컴포넌트
 */
function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="status-bar">
          <span className="time">12:34</span>
          <div className="icons">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>
        <div className="screen-content">
          {children}
        </div>
      </div>
      <div className="phone-button"></div>
    </div>
  );
}

export default PhoneFrame;
