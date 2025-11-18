import React from 'react';
import Thermometer from './Thermometer';

interface FinalResultsProps {
  totalProblems: number;
  correctAnswers: number;
  averageConfidence: number;
  onRestart: () => void;
}

const FinalResults: React.FC<FinalResultsProps> = ({
  totalProblems,
  correctAnswers,
  averageConfidence,
  onRestart,
}) => {
  const accuracy = Math.round((correctAnswers / totalProblems) * 100);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-white">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">학습 완료!</h1>

      {/* 온도계로 정확도 표시 */}
      <div className="mb-8">
        <Thermometer value={accuracy} showSlider={false} animated />
      </div>

      {/* 통계 */}
      <div className="w-full bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">학습 결과</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">정답률</span>
            <span className="text-2xl font-bold text-primary-600">{accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">맞힌 문제</span>
            <span className="font-semibold">
              {correctAnswers} / {totalProblems}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">평균 확신도</span>
            <span className="font-semibold">{Math.round(averageConfidence)}%</span>
          </div>
        </div>
      </div>

      {/* 다시 시작 버튼 */}
      <button
        onClick={onRestart}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all active:scale-95"
      >
        다시 시작
      </button>
    </div>
  );
};

export default FinalResults;
