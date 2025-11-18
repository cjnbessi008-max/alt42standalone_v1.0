import React, { type ReactNode } from 'react';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  scale?: number;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
  scale = 0.8,
}) => {
  return (
    <div className={`smartphone-container ${position}`} style={{ transform: `scale(${scale})` }}>
      <div className="smartphone-frame">
        {/* Phone hardware details */}
        <div className="phone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* Screen area */}
        <div className="phone-screen">
          <div className="status-bar">
            <div className="status-time">12:34</div>
            <div className="status-icons">
              <span className="signal-icon">📶</span>
              <span className="battery-icon">🔋</span>
            </div>
          </div>

          {/* Content area */}
          <div className="phone-content">{children}</div>
        </div>

        {/* Home button / gesture bar */}
        <div className="phone-home-indicator"></div>
      </div>

      {/* Shadow */}
      <div className="smartphone-shadow"></div>
    </div>
  );
};
