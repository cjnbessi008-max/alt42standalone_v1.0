/**
 * Celebration Animation Component
 *
 * Shows celebratory animations for milestones
 */

import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';
import { Celebration } from '../types/motivationMode.types';

interface CelebrationAnimationProps {
  celebration: Celebration;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  celebration,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  if (celebration.animation === 'confetti') {
    return <ConfettiAnimation />;
  }

  if (celebration.animation === 'fire_celebration') {
    return <FireCelebration value={celebration.value} />;
  }

  return null;
};

/**
 * Confetti Animation
 */
const confettiFall = keyframes`
  0% {
    transform: translateY(-100%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const ConfettiAnimation: React.FC = () => {
  const confettiColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const confettiCount = 50;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {Array.from({ length: confettiCount }).map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: -20,
            left: `${Math.random() * 100}%`,
            width: 10,
            height: 10,
            backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            animation: `${confettiFall} ${2 + Math.random() * 2}s linear`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </Box>
  );
};

/**
 * Fire Celebration for Streaks
 */
const fireFloat = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.5);
    opacity: 0;
  }
`;

interface FireCelebrationProps {
  value: number;
}

const FireCelebration: React.FC<FireCelebrationProps> = ({ value }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          fontSize: 120,
          animation: `${fireFloat} 2s ease-out`,
        }}
      >
        🔥
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {value}
      </Box>
    </Box>
  );
};
