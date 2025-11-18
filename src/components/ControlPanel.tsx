import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { DistributionType, DistributionParams } from '../types';

/**
 * 분포 변경을 제어하는 컨트롤 패널
 */
export const ControlPanel: React.FC = () => {
  const { currentDistribution, setCurrentDistribution, setTargetDistribution, startMorph } =
    useAppStore();

  const [selectedType, setSelectedType] = useState<DistributionType>('normal');
  const [params, setParams] = useState({
    mean: 0,
    stdDev: 1,
    min: 0,
    max: 1,
    n: 10,
    p: 0.5,
    lambda: 1,
  });

  const distributionTypes: { value: DistributionType; label: string }[] = [
    { value: 'normal', label: '정규 분포' },
    { value: 'uniform', label: '균등 분포' },
    { value: 'binomial', label: '이항 분포' },
    { value: 'exponential', label: '지수 분포' },
    { value: 'poisson', label: '푸아송 분포' },
  ];

  const handleMorph = () => {
    const newDistribution: DistributionParams = {
      type: selectedType,
      ...(selectedType === 'normal' && {
        mean: params.mean,
        stdDev: params.stdDev,
      }),
      ...(selectedType === 'uniform' && {
        min: params.min,
        max: params.max,
      }),
      ...(selectedType === 'binomial' && {
        n: params.n,
        p: params.p,
      }),
      ...(selectedType === 'exponential' && {
        lambda: params.lambda,
      }),
      ...(selectedType === 'poisson' && {
        lambda: params.lambda,
      }),
    };

    setTargetDistribution(newDistribution);
    startMorph();

    // Update current distribution after morph completes
    setTimeout(() => {
      setCurrentDistribution(newDistribution);
      setTargetDistribution(null);
    }, 2000);
  };

  const renderParameterInputs = () => {
    switch (selectedType) {
      case 'normal':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                평균 (μ): {params.mean}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={params.mean}
                onChange={(e) => setParams({ ...params, mean: parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                표준편차 (σ): {params.stdDev}
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={params.stdDev}
                onChange={(e) => setParams({ ...params, stdDev: parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        );

      case 'uniform':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                최소값: {params.min}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={params.min}
                onChange={(e) => setParams({ ...params, min: parseFloat(e.target.value) })}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                최대값: {params.max}
              </label>
              <input
                type="range"
                min="-5"
                max="10"
                step="0.1"
                value={params.max}
                onChange={(e) => setParams({ ...params, max: parseFloat(e.target.value) })}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        );

      case 'binomial':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                시행 횟수 (n): {params.n}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={params.n}
                onChange={(e) => setParams({ ...params, n: parseInt(e.target.value) })}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                성공 확률 (p): {params.p}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.p}
                onChange={(e) => setParams({ ...params, p: parseFloat(e.target.value) })}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        );

      case 'exponential':
      case 'poisson':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              람다 (λ): {params.lambda}
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={params.lambda}
              onChange={(e) => setParams({ ...params, lambda: parseFloat(e.target.value) })}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Distribution Morph</h1>
        <p className="text-gray-600 mb-6">확률분포의 부드러운 변형을 시각화합니다</p>

        {/* Distribution type selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            분포 유형 선택
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {distributionTypes.map((dist) => (
              <button
                key={dist.value}
                onClick={() => setSelectedType(dist.value)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  selectedType === dist.value
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dist.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter controls */}
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">파라미터 조정</h3>
          {renderParameterInputs()}
        </div>

        {/* Morph button */}
        <motion.button
          onClick={handleMorph}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          분포 변형 시작
        </motion.button>

        {/* Current distribution info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">현재 분포 정보</h4>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between py-1">
              <span>유형:</span>
              <span className="font-mono">
                {distributionTypes.find((d) => d.value === currentDistribution.type)?.label}
              </span>
            </div>
            {currentDistribution.mean !== undefined && (
              <div className="flex justify-between py-1">
                <span>평균 (μ):</span>
                <span className="font-mono">{currentDistribution.mean.toFixed(2)}</span>
              </div>
            )}
            {currentDistribution.stdDev !== undefined && (
              <div className="flex justify-between py-1">
                <span>표준편차 (σ):</span>
                <span className="font-mono">{currentDistribution.stdDev.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Moodle integration info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Moodle LMS 연동 준비 완료
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
