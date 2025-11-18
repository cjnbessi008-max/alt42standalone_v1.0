/**
 * Mobile Simulator Component
 * Displays content in a virtual smartphone screen (bottom right)
 */

import React, { useState } from 'react';
import type { MobileSimulatorConfig } from '@types/index';

interface MobileSimulatorProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  config?: Partial<MobileSimulatorConfig>;
  onClose?: () => void;
  minimizable?: boolean;
}

const DEVICE_CONFIGS: Record<string, MobileSimulatorConfig> = {
  iphone: {
    deviceType: 'iphone',
    orientation: 'portrait',
    width: 375,
    height: 667,
    scale: 0.6,
  },
  android: {
    deviceType: 'android',
    orientation: 'portrait',
    width: 360,
    height: 640,
    scale: 0.6,
  },
  tablet: {
    deviceType: 'tablet',
    orientation: 'portrait',
    width: 768,
    height: 1024,
    scale: 0.45,
  },
};

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  children,
  position = 'bottom-right',
  config,
  onClose,
  minimizable = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [deviceType, setDeviceType] = useState<'iphone' | 'android' | 'tablet'>('iphone');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const deviceConfig = {
    ...DEVICE_CONFIGS[deviceType],
    ...config,
    orientation,
  };

  const actualWidth = orientation === 'landscape' ? deviceConfig.height : deviceConfig.width;
  const actualHeight = orientation === 'landscape' ? deviceConfig.width : deviceConfig.height;
  const scaledWidth = actualWidth * deviceConfig.scale;
  const scaledHeight = actualHeight * deviceConfig.scale;

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...base, bottom: 20, left: 20 };
      case 'top-right':
        return { ...base, top: 20, right: 20 };
      case 'top-left':
        return { ...base, top: 20, left: 20 };
      default:
        return { ...base, bottom: 20, right: 20 };
    }
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  if (isMinimized) {
    return (
      <div
        style={{
          ...getPositionStyles(),
          width: '60px',
          height: '60px',
          backgroundColor: '#3B82F6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={() => setIsMinimized(false)}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
      </div>
    );
  }

  return (
    <div style={getPositionStyles()}>
      {/* Control Panel */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          minWidth: scaledWidth,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as any)}
            style={{
              padding: '4px 8px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <option value="iphone">iPhone</option>
            <option value="android">Android</option>
            <option value="tablet">Tablet</option>
          </select>

          <button
            onClick={toggleOrientation}
            style={{
              padding: '4px 8px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Rotate"
          >
            ⟲
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {minimizable && (
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              title="Minimize"
            >
              −
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Device Frame */}
      <div
        style={{
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor: '#1E293B',
          borderRadius: '0 0 32px 32px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          position: 'relative',
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              height: '24px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: '10px',
              color: '#64748B',
            }}
          >
            <span>9:41</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Content Area */}
          <div
            style={{
              height: 'calc(100% - 24px)',
              overflow: 'auto',
              transform: `scale(${deviceConfig.scale})`,
              transformOrigin: 'top left',
              width: `${100 / deviceConfig.scale}%`,
              height: `${100 / deviceConfig.scale}%`,
            }}
          >
            {children}
          </div>
        </div>

        {/* Home Button (for iPhone) */}
        {deviceType === 'iphone' && orientation === 'portrait' && (
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '4px',
              backgroundColor: '#475569',
              borderRadius: '2px',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MobileSimulator;
