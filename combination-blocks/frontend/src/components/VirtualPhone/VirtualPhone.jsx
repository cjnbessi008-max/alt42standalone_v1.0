import React from 'react';
import './VirtualPhone.css';

/**
 * VirtualPhone Component
 * Renders a virtual smartphone frame in the bottom-right corner
 * that displays the Combination Blocks app interface
 */
const VirtualPhone = ({ children, position = 'bottom-right' }) => {
  return (
    <div className={`virtual-phone ${position}`}>
      {/* Phone Frame */}
      <div className="phone-frame">
        {/* Top Notch */}
        <div className="phone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* Screen */}
        <div className="phone-screen">
          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="status-icons">
              <span className="status-icon">📶</span>
              <span className="status-icon">📡</span>
              <span className="status-icon">🔋</span>
            </div>
          </div>

          {/* App Content */}
          <div className="phone-content">
            {children}
          </div>
        </div>

        {/* Home Button */}
        <div className="phone-home-button"></div>
      </div>
    </div>
  );
};

export default VirtualPhone;
