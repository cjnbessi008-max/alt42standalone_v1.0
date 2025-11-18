import React, { ReactNode } from 'react';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: number;
  height?: number;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
  width = 375,
  height = 667,
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={`smartphone-container fixed ${positionClasses[position]} z-50`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Phone Frame */}
      <div className="smartphone-frame">
        {/* Notch/Camera */}
        <div className="smartphone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* Screen Content */}
        <div className="smartphone-screen">
          {children}
        </div>

        {/* Home Button/Indicator */}
        <div className="smartphone-bottom">
          <div className="home-indicator"></div>
        </div>
      </div>

      {/* Power Button */}
      <div className="power-button"></div>

      {/* Volume Buttons */}
      <div className="volume-buttons">
        <div className="volume-up"></div>
        <div className="volume-down"></div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
