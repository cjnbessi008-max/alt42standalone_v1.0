import React, { ReactNode } from 'react';

interface MobileSimulatorProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

/**
 * Mobile smartphone simulator wrapper
 * Displays content in a smartphone-like frame
 */
const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const positionStyles = {
    'bottom-right': {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
    },
    'bottom-left': {
      position: 'fixed' as const,
      bottom: '20px',
      left: '20px',
    },
    center: {
      margin: '40px auto',
    },
  };

  return (
    <div
      style={{
        ...positionStyles[position],
        zIndex: 1000,
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          width: '375px',
          height: '667px',
          backgroundColor: '#1A1A1A',
          borderRadius: '40px',
          padding: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        {/* Notch (iPhone-style) */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '140px',
            height: '28px',
            backgroundColor: '#1A1A1A',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            zIndex: 1002,
          }}
        >
          {/* Speaker */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '6px',
              backgroundColor: '#333',
              borderRadius: '3px',
            }}
          />
        </div>

        {/* Screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '32px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: '44px',
              backgroundColor: '#F8F8F8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#000',
              borderTopLeftRadius: '32px',
              borderTopRightRadius: '32px',
            }}
          >
            <span>9:41</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Content area */}
          <div
            style={{
              height: 'calc(100% - 44px)',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '134px',
            height: '5px',
            backgroundColor: '#FFFFFF',
            borderRadius: '2.5px',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Toggle button */}
      <button
        onClick={() => {
          const simulator = document.querySelector('[data-mobile-simulator]') as HTMLElement;
          if (simulator) {
            simulator.style.display = simulator.style.display === 'none' ? 'block' : 'none';
          }
        }}
        style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          padding: '8px 16px',
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)',
        }}
      >
        📱 Mobile Preview
      </button>
    </div>
  );
};

export default MobileSimulator;
