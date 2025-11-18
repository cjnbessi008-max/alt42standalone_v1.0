import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number; // 초 단위
  onComplete?: () => void;
  autoStart?: boolean;
  showProgress?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  autoStart = true,
  showProgress = true
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-2">
        <span className="text-3xl font-bold text-primary-700">
          {timeLeft}초
        </span>
      </div>

      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
