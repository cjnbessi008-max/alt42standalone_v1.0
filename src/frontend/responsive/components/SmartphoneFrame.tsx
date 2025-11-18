/**
 * SmartphoneFrame Component
 * Simulates a smartphone screen for displaying the vector app
 */

import React, { ReactNode } from 'react';
import '../styles/mobile.css';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'center' | 'bottom-left';
  width?: number;
  height?: number;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
  width = 375,
  height = 667,
}) => {
  const getPositionStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return {
          ...baseStyle,
          bottom: '20px',
          right: '20px',
        };
      case 'bottom-left':
        return {
          ...baseStyle,
          bottom: '20px',
          left: '20px',
        };
      case 'center':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={getPositionStyle()}>
      <div
        className="smartphone-frame"
        style={{
          width: `${width}px`,
          minHeight: `${height}px`,
        }}
      >
        {/* Phone notch */}
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '140px',
            height: '25px',
            background: '#000',
            borderRadius: '0 0 15px 15px',
            zIndex: 10,
          }}
        >
          {/* Speaker */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50px',
              height: '5px',
              background: '#1a1a1a',
              borderRadius: '3px',
            }}
          />
          {/* Camera */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '15px',
              width: '8px',
              height: '8px',
              background: '#1a1a1a',
              borderRadius: '50%',
            }}
          />
        </div>

        <div className="smartphone-screen" style={{ height: `${height - 80}px` }}>
          {children}
        </div>

        {/* Home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '5px',
            background: '#444',
            borderRadius: '3px',
          }}
        />
      </div>
    </div>
  );
};
