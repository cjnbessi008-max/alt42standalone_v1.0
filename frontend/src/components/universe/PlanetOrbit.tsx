/**
 * KTM Math Planet - Planet Orbit Component
 * Individual planet in the universe map
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PlanetInfo, PlanetNumber, PlanetStatus } from '../../types/planets';

interface PlanetOrbitProps {
  planetNumber: PlanetNumber;
  planetInfo: PlanetInfo;
  status: PlanetStatus;
  isActive: boolean;
  position: { x: number; y: number };
  onNavigate: (planetNumber: PlanetNumber) => void;
}

export const PlanetOrbit: React.FC<PlanetOrbitProps> = ({
  planetNumber,
  planetInfo,
  status,
  isActive,
  position,
  onNavigate
}) => {
  const isLocked = status === PlanetStatus.LOCKED;
  const isCompleted = status === PlanetStatus.COMPLETED;

  const handleClick = () => {
    if (!isLocked) {
      onNavigate(planetNumber);
    }
  };

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 cursor-pointer"
      style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1.3 : 1,
        opacity: isLocked ? 0.4 : 1
      }}
      whileHover={
        !isLocked
          ? {
              scale: isActive ? 1.4 : 1.2,
              transition: { duration: 0.2 }
            }
          : {}
      }
      onClick={handleClick}
    >
      {/* Planet Circle */}
      <div
        className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${
          isActive
            ? 'ring-4 ring-white ring-offset-4 ring-offset-transparent'
            : ''
        }`}
        style={{
          backgroundColor: planetInfo.color,
          opacity: isLocked ? 0.5 : 1,
          filter: isLocked ? 'grayscale(80%)' : 'none'
        }}
      >
        {/* Planet Icon */}
        <span className="drop-shadow-lg">{planetInfo.icon}</span>

        {/* Status Badge */}
        <div className="absolute -top-2 -right-2">
          {isCompleted && (
            <motion.div
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              ✓
            </motion.div>
          )}
          {isLocked && (
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm">
              🔒
            </div>
          )}
          {isActive && !isCompleted && (
            <motion.div
              className="w-8 h-8 bg-yellow-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
            />
          )}
        </div>

        {/* Glow Effect for Active Planet */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: planetInfo.color,
              filter: 'blur(20px)',
              zIndex: -1
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          />
        )}
      </div>

      {/* Planet Name */}
      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-white font-semibold text-sm whitespace-nowrap">
          {planetInfo.koreanName}
        </p>
        <p className="text-gray-400 text-xs whitespace-nowrap">
          Planet {planetNumber}
        </p>
      </motion.div>

      {/* Orbit Path (decorative) */}
      {isActive && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-2 border-dashed border-white/30"
          style={{
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </motion.div>
  );
};
