import React from 'react';
import { CorrespondenceItem as Item } from '../../types';

interface CorrespondenceItemProps {
  item: Item;
  side: 'left' | 'right';
  isConnected: boolean;
  isActive: boolean;
  onConnectionStart: (itemId: string, side: 'left' | 'right') => void;
  onConnectionEnd: (itemId: string, side: 'left' | 'right') => void;
}

const CorrespondenceItem: React.FC<CorrespondenceItemProps> = ({
  item,
  side,
  isConnected,
  isActive,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const handleMouseDown = () => {
    onConnectionStart(item.id, side);
  };

  const handleMouseUp = () => {
    onConnectionEnd(item.id, side);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onConnectionStart(item.id, side);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onConnectionEnd(item.id, side);
  };

  return (
    <div
      className={`correspondence-item ${side} ${isConnected ? 'connected' : ''} ${
        isActive ? 'active' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        padding: '16px 20px',
        margin: '12px 0',
        backgroundColor: isActive ? '#FFF3E0' : isConnected ? '#E3F2FD' : '#FFFFFF',
        border: `2px solid ${
          isActive ? '#FFA726' : isConnected ? '#4A90E2' : '#E0E0E0'
        }`,
        borderRadius: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        boxShadow: isActive
          ? '0 4px 12px rgba(255, 167, 38, 0.3)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        position: 'relative',
      }}
    >
      {/* Connection point indicator */}
      <div
        style={{
          position: 'absolute',
          [side === 'left' ? 'right' : 'left']: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: isActive
            ? '#FFA726'
            : isConnected
            ? '#4A90E2'
            : '#BDBDBD',
          border: '3px solid white',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />

      {/* Image if provided */}
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.text}
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginRight: side === 'left' ? '12px' : '0',
            marginLeft: side === 'right' ? '12px' : '0',
          }}
        />
      )}

      {/* Item text */}
      <span
        style={{
          fontSize: '16px',
          fontWeight: isConnected ? '600' : '400',
          color: '#333',
          order: side === 'left' ? 1 : -1,
        }}
      >
        {item.text}
      </span>
    </div>
  );
};

export default CorrespondenceItem;
