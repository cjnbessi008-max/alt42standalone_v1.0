import React from 'react';
import './MobileSimulator.css';

interface MobileSimulatorProps {
  children: React.ReactNode;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ children }) => {
  return (
    <div className="mobile-simulator-container">
      <div className="mobile-device">
        <div className="device-frame">
          <div className="device-header">
            <div className="notch">
              <div className="camera"></div>
              <div className="speaker"></div>
            </div>
          </div>
          <div className="device-screen">
            {children}
          </div>
          <div className="device-footer">
            <div className="home-indicator"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
