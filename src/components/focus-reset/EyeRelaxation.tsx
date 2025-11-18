import React, { useState, useEffect } from 'react';

interface EyeRelaxationProps {
  duration: number;
  onComplete: () => void;
}

export const EyeRelaxation: React.FC<EyeRelaxationProps> = ({
  duration,
  onComplete
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      const positions = [
        { x: 50, y: 20 },  // 위
        { x: 80, y: 50 },  // 오른쪽
        { x: 50, y: 80 },  // 아래
        { x: 20, y: 50 },  // 왼쪽
        { x: 50, y: 50 }   // 중앙
      ];

      setPosition(positions[Math.floor(Math.random() * positions.length)]);
    }, 2000);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(moveInterval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(timer);
    };
  }, [duration, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full mb-8 shadow-lg overflow-hidden">
        <div
          className="absolute w-8 h-8 bg-green-500 rounded-full shadow-lg transition-all duration-1000 ease-in-out"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">👀</div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        눈 운동
      </h3>

      <p className="text-lg text-gray-600 mb-6 text-center">
        움직이는 점을 눈으로 따라가세요
      </p>

      <div className="text-4xl font-bold text-primary-600 mb-2">
        {timeLeft}초
      </div>

      <div className="text-sm text-gray-500">
        눈의 피로를 풀어주세요
      </div>
    </div>
  );
};
