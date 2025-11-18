import React from 'react';
import { SmartphoneConfig } from '@/types';

interface SmartphoneFrameProps {
  config?: Partial<SmartphoneConfig>;
  children: React.ReactNode;
}

/**
 * SmartphoneFrame Component
 * Displays content within a smartphone-like frame
 * Used to preview educational content as it would appear on student devices
 */
const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  config = {},
  children
}) => {
  const {
    width = 375,
    height = 667,
    position = 'bottom-right',
    scale = 0.8,
    showFrame = true
  } = config;

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  const frameStyles: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(${scale})`,
    transformOrigin: position.includes('right') ? 'bottom right' : 'bottom left',
    backgroundColor: '#000',
    borderRadius: showFrame ? '40px' : '0',
    padding: showFrame ? '60px 15px 60px 15px' : '0',
    boxShadow: showFrame ? '0 20px 60px rgba(0, 0, 0, 0.3)' : 'none',
    border: showFrame ? '10px solid #1a1a1a' : 'none',
    overflow: 'hidden',
  };

  const screenStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: showFrame ? '10px' : '0',
    overflow: 'auto',
    position: 'relative',
  };

  const notchStyles: React.CSSProperties = {
    position: 'absolute',
    top: showFrame ? '10px' : '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '150px',
    height: '30px',
    backgroundColor: '#000',
    borderRadius: '0 0 20px 20px',
    zIndex: 10,
  };

  return (
    <div style={getPositionStyles()}>
      <div style={frameStyles}>
        {showFrame && <div style={notchStyles} />}
        <div style={screenStyles}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SmartphoneFrame;
