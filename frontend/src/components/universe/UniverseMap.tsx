/**
 * KTM Math Planet - Universe Map Component
 * Displays the solar system with all 6 planets
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '../../store/journeyStore';
import { PLANET_METADATA, PlanetNumber } from '../../types/planets';
import { PlanetOrbit } from './PlanetOrbit';
import { Spaceship } from './Spaceship';

export const UniverseMap: React.FC = () => {
  const {
    currentModule,
    currentPlanet,
    getPlanetStatus,
    getOverallProgress,
    navigateToPlanet
  } = useJourneyStore();

  const overallProgress = getOverallProgress();

  if (!currentModule) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">모듈을 선택하거나 새로 만들어주세요</h2>
          <button className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition">
            ➕ 새 모듈 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center backdrop-blur-sm bg-black/30">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>🪐</span>
            KTM Math Planet
          </h1>
          <p className="text-gray-300 mt-1">모듈: {currentModule.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-white hover:bg-white/10 rounded-lg transition">
            🔔
          </button>
          <button className="p-2 text-white hover:bg-white/10 rounded-lg transition">
            ⚙️
          </button>
        </div>
      </header>

      {/* Spaceship Progress Bar */}
      <Spaceship
        moduleName={currentModule.name}
        currentPlanet={currentPlanet}
        overallProgress={overallProgress}
      />

      {/* Main Universe View */}
      <main className="container mx-auto px-6 py-12">
        <div className="relative w-full h-[600px]">
          {/* Central Sun */}
          <motion.div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="text-8xl">☀️</div>
            <p className="text-center text-yellow-300 font-bold mt-2">
              KTM Math Sun
            </p>
          </motion.div>

          {/* Planets arranged in a circle */}
          {[
            PlanetNumber.DISCOVERY,
            PlanetNumber.LOGIC,
            PlanetNumber.DATA,
            PlanetNumber.INTERFACE,
            PlanetNumber.CREATION,
            PlanetNumber.LAUNCH
          ].map((planetNumber, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180); // Start from top
            const radius = 220;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <PlanetOrbit
                key={planetNumber}
                planetNumber={planetNumber}
                planetInfo={PLANET_METADATA[planetNumber]}
                status={getPlanetStatus(planetNumber)}
                isActive={planetNumber === currentPlanet}
                position={{ x, y }}
                onNavigate={navigateToPlanet}
              />
            );
          })}
        </div>

        {/* Current Planet Info */}
        <motion.div
          className="mt-12 max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <span className="text-6xl">
              {PLANET_METADATA[currentPlanet].icon}
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {PLANET_METADATA[currentPlanet].koreanName}
              </h2>
              <p className="text-gray-300 mb-1">
                {PLANET_METADATA[currentPlanet].name}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {PLANET_METADATA[currentPlanet].description}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigateToPlanet(currentPlanet)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition"
                >
                  🔭 현재 행성으로 이동
                </button>
                <button className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition">
                  📋 모듈 목록
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
