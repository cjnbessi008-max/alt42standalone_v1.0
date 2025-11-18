import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { DistributionChart } from './DistributionChart';
import { useAppStore } from '../store/useAppStore';
import {
  generateDistribution,
  interpolateDistributions,
} from '../utils/distributionCalculator';
import { DistributionPoint } from '../types';

/**
 * 확률분포가 부드럽게 변형되는 Distribution Morph 컴포넌트
 */
export const DistributionMorph: React.FC = () => {
  const {
    currentDistribution,
    targetDistribution,
    isMorphing,
    morphProgress,
    updateMorphProgress,
  } = useAppStore();

  const [displayData, setDisplayData] = useState<DistributionPoint[]>([]);
  const [distributionName, setDistributionName] = useState<string>('');
  const controls = useAnimation();

  // Generate initial distribution
  useEffect(() => {
    const data = generateDistribution(currentDistribution);
    setDisplayData(data);
    setDistributionName(getDistributionName(currentDistribution.type));
  }, [currentDistribution]);

  // Handle morphing animation
  useEffect(() => {
    if (!isMorphing || !targetDistribution) return;

    const fromData = generateDistribution(currentDistribution);
    const toData = generateDistribution(targetDistribution);

    let animationFrame: number;
    let startTime: number;
    const duration = 2000; // 2 seconds

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const interpolated = interpolateDistributions(fromData, toData, progress);
      setDisplayData(interpolated);
      updateMorphProgress(progress);

      // Update distribution name during transition
      if (progress < 0.5) {
        setDistributionName(getDistributionName(currentDistribution.type));
      } else {
        setDistributionName(getDistributionName(targetDistribution.type));
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDistributionName(getDistributionName(targetDistribution.type));
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isMorphing, currentDistribution, targetDistribution, updateMorphProgress]);

  // Animate container on morph
  useEffect(() => {
    if (isMorphing) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.5 },
      });
    }
  }, [isMorphing, controls]);

  function getDistributionName(type: string): string {
    const names: Record<string, string> = {
      normal: '정규 분포',
      uniform: '균등 분포',
      binomial: '이항 분포',
      exponential: '지수 분포',
      poisson: '푸아송 분포',
    };
    return names[type] || type;
  }

  return (
    <motion.div
      className="w-full px-4 py-6"
      animate={controls}
    >
      {/* Distribution info card */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">{distributionName}</h2>
          {isMorphing && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium">변환 중...</span>
            </motion.div>
          )}
        </div>

        {/* Progress bar */}
        {isMorphing && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <motion.div
              className="bg-blue-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${morphProgress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        {/* Distribution parameters */}
        <div className="text-xs text-gray-600 space-y-1">
          {currentDistribution.mean !== undefined && (
            <div className="flex justify-between">
              <span>평균 (μ):</span>
              <span className="font-mono">{currentDistribution.mean.toFixed(2)}</span>
            </div>
          )}
          {currentDistribution.stdDev !== undefined && (
            <div className="flex justify-between">
              <span>표준편차 (σ):</span>
              <span className="font-mono">{currentDistribution.stdDev.toFixed(2)}</span>
            </div>
          )}
          {currentDistribution.min !== undefined && (
            <div className="flex justify-between">
              <span>최소값:</span>
              <span className="font-mono">{currentDistribution.min.toFixed(2)}</span>
            </div>
          )}
          {currentDistribution.max !== undefined && (
            <div className="flex justify-between">
              <span>최대값:</span>
              <span className="font-mono">{currentDistribution.max.toFixed(2)}</span>
            </div>
          )}
          {currentDistribution.lambda !== undefined && (
            <div className="flex justify-between">
              <span>람다 (λ):</span>
              <span className="font-mono">{currentDistribution.lambda.toFixed(2)}</span>
            </div>
          )}
          {currentDistribution.n !== undefined && (
            <div className="flex justify-between">
              <span>시행 횟수 (n):</span>
              <span className="font-mono">{currentDistribution.n}</span>
            </div>
          )}
          {currentDistribution.p !== undefined && (
            <div className="flex justify-between">
              <span>확률 (p):</span>
              <span className="font-mono">{currentDistribution.p.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <DistributionChart
          data={displayData}
          width={320}
          height={380}
          color={isMorphing ? '#8b5cf6' : '#3b82f6'}
          title={distributionName}
        />
      </div>
    </motion.div>
  );
};
