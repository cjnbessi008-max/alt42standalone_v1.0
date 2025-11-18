import React, { useState, useEffect } from 'react';

interface StretchingGuideProps {
  duration: number;
  onComplete: () => void;
}

const stretchingSteps = [
  {
    title: '목 스트레칭',
    instruction: '천천히 목을 좌우로 돌려주세요',
    icon: '🔄'
  },
  {
    title: '어깨 풀기',
    instruction: '어깨를 위아래로 움직여주세요',
    icon: '💪'
  },
  {
    title: '손목 운동',
    instruction: '손목을 돌려주세요',
    icon: '👋'
  }
];

export const StretchingGuide: React.FC<StretchingGuideProps> = ({
  duration,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const stepDuration = duration / stretchingSteps.length;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        return next >= stretchingSteps.length ? prev : next;
      });
    }, stepDuration * 1000);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(stepInterval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timer);
    };
  }, [duration, onComplete]);

  const step = stretchingSteps[currentStep];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-8xl animate-bounce">
        {step.icon}
      </div>

      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        {step.title}
      </h3>

      <p className="text-lg text-gray-600 mb-6 text-center">
        {step.instruction}
      </p>

      <div className="flex gap-2 mb-6">
        {stretchingSteps.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentStep
                ? 'bg-primary-600'
                : index < currentStep
                ? 'bg-primary-300'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="text-4xl font-bold text-primary-600 mb-2">
        {timeLeft}초
      </div>

      <div className="text-sm text-gray-500">
        간단한 스트레칭으로 몸을 풀어보세요
      </div>
    </div>
  );
};
