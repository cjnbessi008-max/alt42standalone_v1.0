import React, { ReactNode } from 'react';
import './SmartphoneSimulator.css';

interface SmartphoneSimulatorProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  className?: string;
}

/**
 * Smartphone Simulator Component
 * Displays content in a smartphone frame in the bottom-right corner
 */
export const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({
  children,
  position = 'bottom-right',
  className = '',
}) => {
  return (
    <div className={`smartphone-container ${position} ${className}`}>
      <div className="smartphone-frame">
        {/* Top notch */}
        <div className="smartphone-notch">
          <div className="notch-speaker"></div>
          <div className="notch-camera"></div>
        </div>

        {/* Screen */}
        <div className="smartphone-screen">
          {/* Status bar */}
          <div className="status-bar">
            <div className="status-time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="status-icons">
              <span className="signal-icon">📶</span>
              <span className="battery-icon">🔋</span>
            </div>
          </div>

          {/* App content */}
          <div className="app-content">
            {children}
          </div>

          {/* Home indicator */}
          <div className="home-indicator"></div>
        </div>

        {/* Side buttons */}
        <div className="power-button"></div>
        <div className="volume-buttons">
          <div className="volume-up"></div>
          <div className="volume-down"></div>
        </div>
      </div>
    </div>
  );
};

export default SmartphoneSimulator;
