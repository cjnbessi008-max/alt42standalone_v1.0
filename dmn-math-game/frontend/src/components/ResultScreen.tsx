import React from 'react';
import { useGameStore } from '../services/store';
import { gameApi } from '../services/api';

interface ResultScreenProps {
  onPlayAgain: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ onPlayAgain }) => {
  const { session, reset } = useGameStore();

  if (!session) return null;

  const handleFinish = async () => {
    try {
      if (!session.is_completed) {
        await gameApi.endSession(session.id);
      }
      reset();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const getEncouragementMessage = () => {
    const accuracy = session.accuracy;

    if (accuracy >= 90) {
      return '완벽해요! 정말 잘했어요! 🌟';
    } else if (accuracy >= 80) {
      return '훌륭해요! 계속 이렇게 해보세요! 💫';
    } else if (accuracy >= 70) {
      return '잘했어요! 점점 나아지고 있어요! 👍';
    } else if (accuracy >= 60) {
      return '좋아요! 계속 연습하면 더 좋아질 거예요! ✨';
    } else {
      return '괜찮아요! 처음이니까요. 다음엔 더 잘할 수 있어요! 💪';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">수고하셨어요!</h1>
        <p className="text-xl text-gray-600 mb-8">{getEncouragementMessage()}</p>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {session.total_problems}
            </div>
            <div className="text-gray-700">문제를 풀었어요</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {session.correct_answers}
            </div>
            <div className="text-gray-700">맞았어요</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {session.accuracy.toFixed(0)}%
            </div>
            <div className="text-gray-700">정확도</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {session.duration_seconds ? Math.floor(session.duration_seconds / 60) : 0}
            </div>
            <div className="text-gray-700">분 동안 플레이</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button onClick={onPlayAgain} className="btn-primary w-full text-xl">
            다시 하기 🔄
          </button>

          <button onClick={handleFinish} className="btn-secondary w-full text-xl">
            종료하기
          </button>
        </div>

        {/* Tip */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>팁:</strong> 이 게임은 집중적인 학습 후 뇌를 쉬게 하기 위해 만들어졌어요.
            하루에 2-3번 짧게 플레이하면 좋아요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
