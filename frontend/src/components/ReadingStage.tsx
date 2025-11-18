import { useState, useEffect } from 'react';
import type { ProblemReadingStage } from '../types';

interface ReadingStageProps {
  problem: ProblemReadingStage;
  onConfirmReading: (duration: number) => void;
  isLoading?: boolean;
}

export const ReadingStage: React.FC<ReadingStageProps> = ({
  problem,
  onConfirmReading,
  isLoading = false,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const MIN_READING_TIME = 5; // seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsedTime >= MIN_READING_TIME) {
      setCanProceed(true);
    }
  }, [elapsedTime]);

  const handleConfirm = () => {
    if (canProceed) {
      onConfirmReading(elapsedTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{problem.title}</h1>
            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {problem.subject}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                {problem.grade_level}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                {problem.difficulty_level}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">읽기 시간</div>
            <div className="text-2xl font-mono font-bold text-primary-600">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        {/* Stage indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <span className="font-semibold text-primary-600">읽기 단계</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="font-semibold text-gray-400">풀이 단계</span>
          </div>
        </div>
      </div>

      {/* Reading Content */}
      <div className="card mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">문제 설명</h2>
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
              {problem.reading_content}
            </p>
          </div>
        </div>

        {/* Visual aid */}
        {problem.reading_visual_url && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">시각 자료</h3>
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <img
                src={problem.reading_visual_url}
                alt="문제 시각 자료"
                className="max-w-full max-h-96 object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">관련 개념</h3>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Section */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-primary-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            문제를 충분히 읽으셨나요?
          </h3>
          <p className="text-gray-600 mb-6">
            {canProceed ? (
              "문제를 이해했다면 다음 단계로 넘어가세요."
            ) : (
              <>
                최소 {MIN_READING_TIME}초 이상 읽어주세요.
                <span className="font-semibold text-primary-600">
                  {' '}({MIN_READING_TIME - elapsedTime}초 남음)
                </span>
              </>
            )}
          </p>
          <button
            onClick={handleConfirm}
            disabled={!canProceed || isLoading}
            className="btn-primary text-lg px-8 py-3"
          >
            {isLoading ? '처리 중...' : '이해했어요! 문제 풀기 →'}
          </button>
          {!canProceed && (
            <p className="text-sm text-gray-500 mt-4">
              천천히 문제를 읽고 이해하는 시간을 가져보세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
