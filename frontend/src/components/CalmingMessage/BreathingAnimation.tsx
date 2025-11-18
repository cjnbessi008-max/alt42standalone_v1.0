/**
 * BreathingAnimation Component
 * Visual calming animation (breathing circle, pulse, or wave)
 */

import React from 'react';
import './BreathingAnimation.css';

interface BreathingAnimationProps {
  animationType: 'breathing_circle' | 'pulse' | 'wave';
}

export const BreathingAnimation: React.FC<BreathingAnimationProps> = ({ animationType }) => {
  switch (animationType) {
    case 'breathing_circle':
      return (
        <svg
          className="breathing-animation breathing-circle-type"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="40" className="breathing-circle" />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            className="breathing-text"
            fontSize="12"
            fill="#42a5f5"
          >
            숨 쉬기
          </text>
        </svg>
      );

    case 'pulse':
      return (
        <div className="breathing-animation pulse-type" aria-hidden="true">
          <div className="pulse-circle" />
          <div className="pulse-ring" />
        </div>
      );

    case 'wave':
      return (
        <svg
          className="breathing-animation wave-type"
          viewBox="0 0 200 100"
          aria-hidden="true"
        >
          <path
            className="wave-path"
            d="M 0 50 Q 25 20, 50 50 T 100 50 T 150 50 T 200 50"
            fill="none"
            stroke="#42a5f5"
            strokeWidth="3"
          />
        </svg>
      );

    default:
      return (
        <svg
          className="breathing-animation breathing-circle-type"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="40" className="breathing-circle" />
        </svg>
      );
  }
};
