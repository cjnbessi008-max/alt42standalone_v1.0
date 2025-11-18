/**
 * SmartphoneDisplay Component
 * Virtual smartphone display positioned at bottom-right of screen
 */

import React, { ReactNode } from 'react';
import { SmartphoneConfig } from '@/types';
import './SmartphoneDisplay.css';

interface SmartphoneDisplayProps {
  children: ReactNode;
  config?: Partial<SmartphoneConfig>;
  className?: string;
}

const defaultConfig: SmartphoneConfig = {
  width: 375,
  height: 667,
  position: 'bottom-right',
  scale: 0.8,
};

export const SmartphoneDisplay: React.FC<SmartphoneDisplayProps> = ({
  children,
  config,
  className = '',
}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const { width, height, position, scale } = finalConfig;

  const positionClass = `smartphone-${position}`;

  return (
    <div className={`smartphone-container ${positionClass} ${className}`}>
      <div
        className="smartphone-frame"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }}
      >
        {/* Phone frame decorations */}
        <div className="smartphone-notch"></div>
        <div className="smartphone-speaker"></div>

        {/* Screen content */}
        <div className="smartphone-screen">
          {children}
        </div>

        {/* Home button */}
        <div className="smartphone-home-button"></div>
      </div>
    </div>
  );
};

export default SmartphoneDisplay;
