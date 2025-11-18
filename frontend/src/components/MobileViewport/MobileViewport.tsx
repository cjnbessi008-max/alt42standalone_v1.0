import React, { ReactNode } from 'react';
import './MobileViewport.css';

interface MobileViewportProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  scale?: number;
  deviceType?: 'iphone-11' | 'iphone-se' | 'samsung-s21';
  showFrame?: boolean;
}

/**
 * Mobile Viewport Container
 * Displays content in a virtual smartphone screen
 * Default position: bottom-right corner
 */
const MobileViewport: React.FC<MobileViewportProps> = ({
  children,
  position = 'bottom-right',
  scale = 0.7,
  deviceType = 'iphone-11',
  showFrame = true
}) => {
  const getDeviceDimensions = () => {
    const devices = {
      'iphone-11': { width: 375, height: 812, borderRadius: 40 },
      'iphone-se': { width: 375, height: 667, borderRadius: 30 },
      'samsung-s21': { width: 360, height: 800, borderRadius: 35 }
    };
    return devices[deviceType];
  };

  const device = getDeviceDimensions();

  const getPositionStyles = () => {
    const positions = {
      'bottom-right': {
        bottom: '20px',
        right: '20px',
        transformOrigin: 'bottom right'
      },
      'bottom-left': {
        bottom: '20px',
        left: '20px',
        transformOrigin: 'bottom left'
      },
      'center': {
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center'
      }
    };
    return positions[position];
  };

  return (
    <div
      className={`mobile-viewport ${position} ${showFrame ? 'with-frame' : ''}`}
      style={{
        ...getPositionStyles(),
        width: `${device.width}px`,
        height: `${device.height}px`,
        ...(position !== 'center' && { transform: `scale(${scale})` })
      }}
    >
      {showFrame && (
        <>
          <div className="device-frame" style={{ borderRadius: `${device.borderRadius}px` }}>
            <div className="notch" />
            <div className="status-bar">
              <span className="time">9:41</span>
              <div className="status-icons">
                <span className="signal">📶</span>
                <span className="wifi">📡</span>
                <span className="battery">🔋</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className="viewport-content"
        style={{
          borderRadius: showFrame ? `${device.borderRadius - 8}px` : '0'
        }}
      >
        {children}
      </div>

      {showFrame && (
        <div className="home-indicator" />
      )}
    </div>
  );
};

export default MobileViewport;
