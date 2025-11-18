/**
 * Virtual Phone Component - Displays content in a smartphone-like frame
 * Positioned at bottom right of screen
 */
import React from 'react';
import { motion } from 'framer-motion';

interface VirtualPhoneProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'center';
}

export const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const positionStyles = {
    'bottom-right': {
      position: 'fixed' as const,
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
    },
    'center': {
      margin: '0 auto',
    },
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        ...positionStyles[position],
        width: '375px',
        height: '667px',
        background: 'linear-gradient(145deg, #2d3748, #1a202c)',
        borderRadius: '36px',
        padding: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Phone notch */}
      <div
        style={{
          width: '150px',
          height: '30px',
          background: '#000',
          borderRadius: '0 0 16px 16px',
          margin: '0 auto 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#333' }} />
        <div style={{ width: '50px', height: '4px', borderRadius: '2px', background: '#333' }} />
      </div>

      {/* Phone screen */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: '20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            fontSize: '10px',
            color: '#666',
          }}
        >
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* App content */}
        <div
          style={{
            height: 'calc(100% - 60px)',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {children}
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
            background: '#000',
            borderRadius: '100px',
            opacity: 0.3,
          }}
        />
      </div>

      {/* Phone buttons */}
      <div
        style={{
          position: 'absolute',
          right: '-4px',
          top: '120px',
          width: '4px',
          height: '60px',
          background: '#1a202c',
          borderRadius: '0 2px 2px 0',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-4px',
          top: '200px',
          width: '4px',
          height: '80px',
          background: '#1a202c',
          borderRadius: '0 2px 2px 0',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-4px',
          top: '300px',
          width: '4px',
          height: '80px',
          background: '#1a202c',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </motion.div>
  );
};
