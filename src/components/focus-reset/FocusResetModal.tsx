import React, { useState } from 'react';
import { useFocusResetStore } from '../../stores/focusResetStore';
import { FocusResetActivityType } from '../../types';
import { BreathingExercise } from './BreathingExercise';
import { StretchingGuide } from './StretchingGuide';
import { EyeRelaxation } from './EyeRelaxation';
import { Button } from '../common/Button';

interface FocusResetModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const FocusResetModal: React.FC<FocusResetModalProps> = ({
  onComplete,
  onSkip
}) => {
  const { settings, currentSession } = useFocusResetStore();
  const [selectedActivity, setSelectedActivity] = useState<FocusResetActivityType>(
    settings.preferredActivity
  );
  const [started, setStarted] = useState(false);

  if (!currentSession) return null;

  const handleStart = () => {
    setStarted(true);
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    onSkip();
  };

  const renderActivitySelector = () => (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          🧘 머리정리 시간
        </h2>
        <p className="text-lg text-gray-600">
          잠깐 쉬면서 집중력을 재충전하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setSelectedActivity('breathing')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedActivity === 'breathing'
              ? 'border-primary-600 bg-primary-50 shadow-lg'
              : 'border-gray-300 hover:border-primary-300'
          }`}
        >
          <div className="text-4xl mb-3">🫁</div>
          <h3 className="font-bold text-lg mb-2">심호흡</h3>
          <p className="text-sm text-gray-600">
            깊은 호흡으로 마음을 안정시켜요
          </p>
        </button>

        <button
          onClick={() => setSelectedActivity('stretching')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedActivity === 'stretching'
              ? 'border-primary-600 bg-primary-50 shadow-lg'
              : 'border-gray-300 hover:border-primary-300'
          }`}
        >
          <div className="text-4xl mb-3">🤸</div>
          <h3 className="font-bold text-lg mb-2">스트레칭</h3>
          <p className="text-sm text-gray-600">
            간단한 동작으로 몸을 풀어요
          </p>
        </button>

        <button
          onClick={() => setSelectedActivity('eye-relaxation')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedActivity === 'eye-relaxation'
              ? 'border-primary-600 bg-primary-50 shadow-lg'
              : 'border-gray-300 hover:border-primary-300'
          }`}
        >
          <div className="text-4xl mb-3">👁️</div>
          <h3 className="font-bold text-lg mb-2">눈 운동</h3>
          <p className="text-sm text-gray-600">
            눈의 피로를 풀어줘요
          </p>
        </button>
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStart}
        >
          시작하기 ({settings.duration}초)
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
        >
          건너뛰기
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>💡 규칙적인 휴식은 학습 효율을 높여줍니다</p>
      </div>
    </div>
  );

  const renderActivity = () => {
    const duration = settings.duration;

    switch (selectedActivity) {
      case 'breathing':
        return <BreathingExercise duration={duration} onComplete={handleComplete} />;
      case 'stretching':
        return <StretchingGuide duration={duration} onComplete={handleComplete} />;
      case 'eye-relaxation':
        return <EyeRelaxation duration={duration} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 animate-slide-up">
        {!started ? renderActivitySelector() : renderActivity()}
      </div>
    </div>
  );
};
