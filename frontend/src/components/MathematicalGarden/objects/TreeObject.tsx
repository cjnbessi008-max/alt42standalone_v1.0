import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GardenObject } from '@/types';
import './GardenObjects.css';

interface TreeObjectProps {
  object: GardenObject;
  isSelected: boolean;
  onClick: () => void;
  delay?: number;
  animationType?: 'fade' | 'grow' | 'bounce' | 'slide';
}

const TreeObject: React.FC<TreeObjectProps> = ({
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
      className={`garden-object tree-object ${isSelected ? 'selected' : ''}`}
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
        height={object.size * 1.2}
        viewBox="0 0 100 120"
        className="tree-svg"
      >
        {/* Trunk */}
        <rect
          x="42"
          y="60"
          width="16"
          height="55"
          fill="#8B4513"
          rx="3"
        />

        {/* Tree Crown - 3 layers */}
        <ellipse
          cx="50"
          cy="65"
          rx="28"
          ry="25"
          fill={object.color}
          opacity="0.9"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="32"
          ry="28"
          fill={object.color}
          opacity="0.95"
        />
        <ellipse
          cx="50"
          cy="35"
          rx="28"
          ry="25"
          fill={object.color}
        />

        {/* Fruits/Details */}
        {object.value >= 5 && (
          <>
            <circle cx="35" cy="40" r="4" fill="#FF6B6B" />
            <circle cx="65" cy="45" r="4" fill="#FF6B6B" />
            <circle cx="50" cy="55" r="4" fill="#FF6B6B" />
          </>
        )}

        {/* Value Label */}
        {object.label && (
          <text
            x="50"
            y="75"
            textAnchor="middle"
            fontSize="18"
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
          <svg width={object.size + 20} height={object.size * 1.2 + 20} viewBox="0 0 120 140">
            <ellipse
              cx="60"
              cy="70"
              rx="55"
              ry="65"
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

export default TreeObject;
