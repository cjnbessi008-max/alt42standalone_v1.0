/**
 * SmartphoneViewport Component
 *
 * Displays content in a virtual smartphone frame
 * Typically positioned at bottom-right of the screen
 */

import React from 'react';
import { SmartphoneViewportConfig } from '@types/oneFrameCase';
import './SmartphoneViewport.css';

interface SmartphoneViewportProps extends SmartphoneViewportConfig {
  children: React.ReactNode;
  className?: string;
}

const SmartphoneViewport: React.FC<SmartphoneViewportProps> = ({
  width = 375,
  height = 667,
  position = 'bottom-right',
  scale = 0.6,
  showFrame = true,
  showNotch = true,
  children,
  className = '',
}) => {
  const viewportStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };

  if (!showFrame) {
    return (
      <div
        className={`smartphone-viewport-simple ${position} ${className}`}
        style={viewportStyle}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`smartphone-viewport ${position} ${className}`}>
      <div className="smartphone-frame">
        {showNotch && <div className="smartphone-notch" />}
        <div
          className="smartphone-screen"
          style={viewportStyle}
        >
          {children}
        </div>
        <div className="smartphone-home-indicator" />
      </div>
    </div>
  );
};

export default SmartphoneViewport;
