import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GardenObject } from '@/types';
import './GardenObjects.css';

interface FlowerObjectProps {
  object: GardenObject;
  isSelected: boolean;
  onClick: () => void;
  delay?: number;
  animationType?: 'fade' | 'grow' | 'bounce' | 'slide';
}

const FlowerObject: React.FC<FlowerObjectProps> = ({
  object,
  isSelected,
  onClick,
  delay = 0,
  animationType = 'grow',
}) => {
  // Animation springs
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

  const bounceAnimation = useSpring({
    from: { translateY: 0 },
    to: async (next) => {
      if (animationType === 'bounce') {
        await next({ translateY: -10 });
        await next({ translateY: 0 });
      }
    },
    delay,
    config: {
      tension: 300,
      friction: 10,
    },
  });

  return (
    <animated.div
      className={`garden-object flower-object ${isSelected ? 'selected' : ''}`}
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
      {/* Flower SVG */}
      <svg
        width={object.size}
        height={object.size}
        viewBox="0 0 100 100"
        className="flower-svg"
      >
        {/* Stem */}
        <line
          x1="50"
          y1="60"
          x2="50"
          y2="95"
          stroke="#5A9E3A"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Leaves */}
        <ellipse
          cx="40"
          cy="75"
          rx="8"
          ry="15"
          fill="#7EC850"
          transform="rotate(-30 40 75)"
        />
        <ellipse
          cx="60"
          cy="75"
          rx="8"
          ry="15"
          fill="#7EC850"
          transform="rotate(30 60 75)"
        />

        {/* Flower Petals */}
        <g className="flower-petals">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx="50"
              cy="30"
              rx="12"
              ry="20"
              fill={object.color}
              opacity="0.9"
              transform={`rotate(${i * 60} 50 50)`}
              style={{
                animation: isSelected ? 'petalPulse 0.6s ease-in-out' : 'none',
              }}
            />
          ))}
        </g>

        {/* Flower Center */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="2"
          className={isSelected ? 'pulse-animation' : ''}
        />

        {/* Value Label */}
        {object.label && (
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="#333"
            className="flower-label"
          >
            {object.label}
          </text>
        )}
      </svg>

      {/* Selection Ring */}
      {isSelected && (
        <div className="selection-ring animate-grow">
          <svg width={object.size + 20} height={object.size + 20} viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="55"
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

export default FlowerObject;
