import React from 'react';
import { useQuizStore } from '../../stores/quizStore';
import { useFocusResetStore } from '../../stores/focusResetStore';
import { Button } from '../common/Button';
import { FocusResetActivityType } from '../../types';

interface DashboardProps {
  onStartQuiz: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartQuiz }) => {
  const { session } = useQuizStore();
  const { settings, updateSettings } = useFocusResetStore();

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value);
    updateSettings({ duration });
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frequency = parseInt(e.target.value);
    updateSettings({ frequency });
  };

  const handleActivityChange = (activity: FocusResetActivityType) => {
    updateSettings({ preferredActivity: activity });
  };

  const handleToggleEnabled = () => {
    updateSettings({ enabled: !settings.enabled });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 md:p-12 mb-8 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Focus Reset 학습 시스템
        </h1>
        <p className="text-xl md:text-2xl mb-6 opacity-90">
          머리정리 모드로 집중력을 높여보세요 🧘
        </p>
        <p className="text-lg opacity-80 mb-8">
          문제를 풀다가 집중력이 떨어질 때, 자동으로 휴식 시간을 제공합니다.
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={onStartQuiz}
          disabled={!!session}
        >
          {session ? '퀴즈 진행 중...' : '퀴즈 시작하기 →'}
        </Button>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          ⚙️ 머리정리 모드 설정
        </h2>

        {/* Enable/Disable */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleEnabled}
              className="w-6 h-6 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
            />
            <span className="text-lg font-medium text-gray-700">
              머리정리 모드 활성화
            </span>
          </label>
        </div>

        <div className={settings.enabled ? '' : 'opacity-50 pointer-events-none'}>
          {/* Frequency */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">
              휴식 빈도: {settings.frequency}문제마다
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.frequency}
              onChange={handleFrequencyChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>매 문제</span>
              <span>10문제마다</span>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">
              휴식 시간: {settings.duration}초
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={settings.duration}
              onChange={handleDurationChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>5초</span>
              <span>60초</span>
            </div>
          </div>

          {/* Preferred Activity */}
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              선호하는 활동
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleActivityChange('breathing')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.preferredActivity === 'breathing'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
              >
                <div className="text-3xl mb-2">🫁</div>
                <div className="font-medium">심호흡</div>
              </button>

              <button
                onClick={() => handleActivityChange('stretching')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.preferredActivity === 'stretching'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
              >
                <div className="text-3xl mb-2">🤸</div>
                <div className="font-medium">스트레칭</div>
              </button>

              <button
                onClick={() => handleActivityChange('eye-relaxation')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.preferredActivity === 'eye-relaxation'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
              >
                <div className="text-3xl mb-2">👁️</div>
                <div className="font-medium">눈 운동</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            집중력 향상
          </h3>
          <p className="text-gray-600">
            규칙적인 휴식으로 장시간 학습 시 집중력을 유지합니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            학습 효율 분석
          </h3>
          <p className="text-gray-600">
            문제별 소요 시간과 정답률을 분석하여 학습 패턴을 파악합니다.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            자동 휴식 제안
          </h3>
          <p className="text-gray-600">
            설정한 주기에 따라 자동으로 휴식을 제안합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
