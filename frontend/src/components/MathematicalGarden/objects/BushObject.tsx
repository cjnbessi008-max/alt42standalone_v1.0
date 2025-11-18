import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GardenObject } from '@/types';
import './GardenObjects.css';

interface BushObjectProps {
  object: GardenObject;
  isSelected: boolean;
  onClick: () => void;
  delay?: number;
  animationType?: 'fade' | 'grow' | 'bounce' | 'slide';
}

const BushObject: React.FC<BushObjectProps> = ({
  object,
  isSelected,
  onClick,
  delay = 0,
  animationType = 'grow',
}) => {
  const animation = useSpring({
    from: {
      opacity: animationType === 'fade' ? 0 : 1,
      scale: animationType === 'grow' ? 0 : 1,
      translateY: animationType === 'slide' ? 50 : 0,
    },
    to: {
      opacity: 1,
      scale: isSelected ? 1.2 : 1,
      translateY: 0,
    },
    delay,
    config: {
      tension: 280,
      friction: 20,
    },
  });

  return (
    <animated.div
      className={`garden-object bush-object ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        transform: animation.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
        opacity: animation.opacity,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <svg
        width={object.size}
        height={object.size * 0.8}
        viewBox="0 0 100 80"
        className="bush-svg"
      >
        {/* Bush - multiple overlapping circles */}
        <circle
          cx="30"
          cy="50"
          r="22"
          fill={object.color}
          opacity="0.9"
        />
        <circle
          cx="50"
          cy="45"
          r="25"
          fill={object.color}
        />
        <circle
          cx="70"
          cy="50"
          r="22"
          fill={object.color}
          opacity="0.9"
        />
        <circle
          cx="40"
          cy="60"
          r="20"
          fill={object.color}
          opacity="0.85"
        />
        <circle
          cx="60"
          cy="60"
          r="20"
          fill={object.color}
          opacity="0.85"
        />

        {/* Berries or details */}
        {object.value >= 3 && (
          <>
            <circle cx="35" cy="45" r="3" fill="#FF85B3" />
            <circle cx="55" cy="42" r="3" fill="#FF85B3" />
            <circle cx="65" cy="48" r="3" fill="#FF85B3" />
          </>
        )}

        {/* Value Label */}
        {object.label && (
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="#FFF"
            stroke="#333"
            strokeWidth="0.5"
          >
            {object.label}
          </text>
        )}
      </svg>

      {isSelected && (
        <div className="selection-ring animate-grow">
          <svg width={object.size + 20} height={object.size * 0.8 + 20} viewBox="0 0 120 100">
            <ellipse
              cx="60"
              cy="50"
              rx="55"
              ry="45"
              fill="none"
              stroke="#667eea"
              strokeWidth="3"
              strokeDasharray="10 5"
              className="rotating-ring"
            />
          </svg>
        </div>
      )}
    </animated.div>
  );
};

export default BushObject;
