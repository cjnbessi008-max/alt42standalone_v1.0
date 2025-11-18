/**
 * SmartphoneScreen Component
 * Virtual smartphone display positioned at bottom-right of the screen
 * Displays derivative graphs in a phone-like frame
 */

import React, { useState } from 'react';

export type ScreenPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type ScreenSize = 'small' | 'medium' | 'large';

interface SmartphoneScreenProps {
  children: React.ReactNode;
  position?: ScreenPosition;
  size?: ScreenSize;
  draggable?: boolean;
  resizable?: boolean;
  showFrame?: boolean;
  title?: string;
}

const SmartphoneScreen: React.FC<SmartphoneScreenProps> = ({
  children,
  position = 'bottom-right',
  size = 'medium',
  draggable = false,
  resizable = false,
  showFrame = true,
  title = 'Higher Derivative Lines',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: 280, height: 500 },
    medium: { width: 360, height: 640 },
    large: { width: 420, height: 750 },
  };

  const { width, height } = sizeConfig[size];

  // Position styles
  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 20, left: 20 };
      case 'top-right':
        return { ...baseStyle, top: 20, right: 20 };
      case 'top-left':
        return { ...baseStyle, top: 20, left: 20 };
      default:
        return { ...baseStyle, bottom: 20, right: 20 };
    }
  };

  const containerStyle: React.CSSProperties = {
    ...getPositionStyle(),
    width: isMinimized ? 'auto' : width,
    height: isMinimized ? 'auto' : height,
    backgroundColor: '#ffffff',
    borderRadius: showFrame ? 24 : 8,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: showFrame ? '8px solid #2C3E50' : '1px solid #ddd',
    transition: 'all 0.3s ease',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#2C3E50',
    color: 'white',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #34495E',
    cursor: draggable ? 'move' : 'default',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    margin: 0,
    flex: 1,
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f8f9fa',
    display: isMinimized ? 'none' : 'block',
  };

  const notchStyle: React.CSSProperties = {
    width: 120,
    height: 20,
    backgroundColor: '#2C3E50',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    margin: '0 auto',
    marginBottom: -20,
    position: 'relative',
    zIndex: 1,
  };

  return (
    <div style={containerStyle}>
      {/* Phone notch (for realism) */}
      {showFrame && !isMinimized && <div style={notchStyle} />}

      {/* Header bar */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <div style={buttonContainerStyle}>
          <button
            style={buttonStyle}
            onClick={() => setIsMinimized(!isMinimized)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? '□' : '−'}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={contentStyle}>{children}</div>

      {/* Home indicator (for realism) */}
      {showFrame && !isMinimized && (
        <div
          style={{
            width: 100,
            height: 4,
            backgroundColor: '#2C3E50',
            borderRadius: 2,
            margin: '8px auto',
          }}
        />
      )}
    </div>
  );
};

export default SmartphoneScreen;
