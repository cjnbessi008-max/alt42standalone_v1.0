/**
 * VirtualSmartphone Component
 * Displays content in a smartphone-like interface positioned at bottom-right
 */

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  minimizable?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const VirtualSmartphone: React.FC<Props> = ({
  children,
  title = 'Math Problem',
  onClose,
  minimizable = true,
  position = 'bottom-right'
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: 20, right: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'top-right':
        return { top: 20, right: 20 };
      case 'top-left':
        return { top: 20, left: 20 };
      default:
        return { bottom: 20, right: 20 };
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Smartphone Frame */}
      <div
        style={{
          width: '360px',
          height: isMinimized ? 'auto' : '640px',
          backgroundColor: '#1a1a1a',
          borderRadius: '36px',
          padding: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '2px solid #333'
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#fff',
            borderRadius: '28px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              height: '24px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '11px',
              color: '#666',
              borderBottom: '1px solid #e0e0e0'
            }}
          >
            <span>{new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* App Header */}
          <div
            style={{
              height: '56px',
              backgroundColor: '#2196F3',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
              {title}
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {minimizable && (
                <button
                  onClick={toggleMinimize}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px'
                  }}
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? '▢' : '−'}
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px'
                  }}
                  title="Close"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '16px',
                  backgroundColor: '#fafafa'
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Home Button */}
          {!isMinimized && (
            <div
              style={{
                height: '60px',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderTop: '1px solid #e0e0e0'
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '5px',
                  backgroundColor: '#ccc',
                  borderRadius: '3px'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '24px',
          backgroundColor: '#1a1a1a',
          borderRadius: '0 0 16px 16px',
          zIndex: 1001,
          pointerEvents: 'none'
        }}
      >
        {/* Camera */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '50%',
            border: '1px solid #555'
          }}
        />
      </div>
    </motion.div>
  );
};
