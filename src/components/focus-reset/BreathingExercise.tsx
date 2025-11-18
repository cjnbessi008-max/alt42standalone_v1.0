import React, { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  duration: number;
  onComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  duration,
  onComplete
}) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase((current) => {
        if (current === 'inhale') return 'hold';
        if (current === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000); // 4초마다 단계 변경

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(phaseInterval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(timer);
    };
  }, [duration, onComplete]);

  const phaseText = {
    inhale: '숨을 들이마시세요',
    hold: '숨을 참으세요',
    exhale: '숨을 내쉬세요'
  };

  const phaseColor = {
    inhale: 'bg-blue-500',
    hold: 'bg-yellow-500',
    exhale: 'bg-green-500'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="mb-8">
        <div
          className={`w-32 h-32 rounded-full ${phaseColor[phase]} animate-breathe shadow-2xl`}
        />
      </div>

      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        {phaseText[phase]}
      </h3>

      <p className="text-gray-600 mb-2">호흡을 따라하세요</p>

      <div className="text-4xl font-bold text-primary-600 mb-4">
        {timeLeft}초
      </div>

      <div className="text-sm text-gray-500">
        깊게 호흡하면 집중력이 향상됩니다
      </div>
    </div>
  );
};
