/**
 * KTM Math Planet - Planet Container Component
 * Common layout for all planet work screens
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '../../store/journeyStore';
import { PLANET_METADATA, PlanetNumber } from '../../types/planets';

interface PlanetContainerProps {
  planetNumber: PlanetNumber;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  progressPercentage?: number;
}

export const PlanetContainer: React.FC<PlanetContainerProps> = ({
  planetNumber,
  children,
  onNext,
  onPrevious,
  canProceed = true,
  progressPercentage = 0
}) => {
  const { navigateToPlanet } = useJourneyStore();
  const planetInfo = PLANET_METADATA[planetNumber];

  const handleGoBack = () => {
    navigateToPlanet(PlanetNumber.DISCOVERY); // Go back to universe map
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (planetNumber > 1) {
      navigateToPlanet((planetNumber - 1) as PlanetNumber);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (planetNumber < 6) {
      navigateToPlanet((planetNumber + 1) as PlanetNumber);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom, ${planetInfo.color}15, ${planetInfo.color}05, #000000)`
      }}
    >
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition"
              title="우주 지도로 돌아가기"
            >
              🏠
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{planetInfo.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {planetInfo.koreanName}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    {planetInfo.pipelineStage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Steps Guide */}
          <aside className="w-64 flex-shrink-0">
            <motion.div
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 sticky top-8"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                🎯 진행 단계
              </h3>

              {/* Progress Circle */}
              <div className="mb-6 flex justify-center">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={planetInfo.color}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 251.2' }}
                      animate={{
                        strokeDasharray: `${(progressPercentage / 100) * 251.2} 251.2`
                      }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  🤖 AI 도우미
                </h4>
                <p className="text-xs text-gray-300 mb-3">
                  궁금한 점이 있으면 언제든지 물어보세요!
                </p>
                <button className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm transition">
                  💬 질문하기
                </button>
              </div>
            </motion.div>
          </aside>

          {/* Main Work Area */}
          <div className="flex-1">
            <motion.div
              className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 min-h-[600px]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer - Navigation */}
      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md sticky bottom-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              행성 진행률: <span className="text-white font-semibold">{progressPercentage}%</span>
            </div>
            <div className="flex gap-3">
              {planetNumber > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                >
                  ⬅️ 이전 행성
                </button>
              )}
              <button
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                💾 저장
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition ${
                  canProceed
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {planetNumber === 6 ? '🚀 모듈 배포하기' : '✅ 다음 행성으로'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
