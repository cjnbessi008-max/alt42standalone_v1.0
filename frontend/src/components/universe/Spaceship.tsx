/**
 * KTM Math Planet - Spaceship Progress Component
 * Shows overall journey progress across all planets
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PLANET_METADATA, PlanetNumber } from '../../types/planets';

interface SpaceshipProps {
  moduleName: string;
  currentPlanet: PlanetNumber;
  overallProgress: number;
}

export const Spaceship: React.FC<SpaceshipProps> = ({
  moduleName,
  currentPlanet,
  overallProgress
}) => {
  const planets = [
    PlanetNumber.DISCOVERY,
    PlanetNumber.LOGIC,
    PlanetNumber.DATA,
    PlanetNumber.INTERFACE,
    PlanetNumber.CREATION,
    PlanetNumber.LAUNCH
  ];

  return (
    <div className="mx-6 mt-4">
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        {/* Module Name */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            모듈: "{moduleName}"
          </h2>
          <div className="text-white font-mono text-sm">
            {overallProgress}% 완료
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Spaceship Icon */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 text-2xl"
            initial={{ left: 0 }}
            animate={{ left: `${Math.max(overallProgress - 2, 0)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            🚀
          </motion.div>
        </div>

        {/* Planet Journey Timeline */}
        <div className="flex items-center justify-between relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600 -translate-y-1/2 -z-10" />

          {planets.map((planetNumber, index) => {
            const planetInfo = PLANET_METADATA[planetNumber];
            const isPassed = planetNumber < currentPlanet;
            const isCurrent = planetNumber === currentPlanet;
            const isFuture = planetNumber > currentPlanet;

            return (
              <div
                key={planetNumber}
                className="flex flex-col items-center relative"
              >
                {/* Planet Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    isCurrent
                      ? 'bg-white/20 ring-2 ring-white'
                      : isPassed
                      ? 'bg-green-500/30'
                      : 'bg-gray-700/50'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: isCurrent ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: isCurrent ? 1.5 : 0.3,
                    repeat: isCurrent ? Infinity : 0
                  }}
                >
                  {isPassed ? (
                    <span className="text-green-400">✓</span>
                  ) : isCurrent ? (
                    <span className="animate-pulse">⏳</span>
                  ) : (
                    <span className="text-gray-500">○</span>
                  )}
                </motion.div>

                {/* Planet Name & Icon */}
                <div className="mt-2 text-center">
                  <div className="text-lg">{planetInfo.icon}</div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      isCurrent
                        ? 'text-white'
                        : isPassed
                        ? 'text-green-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {planetInfo.koreanName.replace(' 행성', '')}
                  </p>
                </div>

                {/* Current Planet Indicator */}
                {isCurrent && (
                  <motion.div
                    className="absolute -bottom-8 text-xs text-yellow-300 font-semibold whitespace-nowrap"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    현재 위치
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
