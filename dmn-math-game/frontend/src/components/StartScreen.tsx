import React, { useState, useEffect } from 'react';
import { useGameStore } from '../services/store';
import { gameApi, studentApi } from '../services/api';

const StartScreen: React.FC = () => {
  const { studentId, setStudentId, setSession, setProgress, progress } = useGameStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to get student from URL params (LTI launch)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Coming from LTI launch, load the session
      loadExistingSession(sessionId);
    } else if (!studentId) {
      // No student ID, use demo student
      setStudentId('demo-student-123');
    }

    // Load student progress if we have a student ID
    if (studentId) {
      loadProgress();
    }
  }, [studentId]);

  const loadExistingSession = async (sessionId: string) => {
    try {
      const session = await gameApi.getSession(sessionId);
      setSession(session);
      setStudentId(session.student_id);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const loadProgress = async () => {
    if (!studentId) return;

    try {
      const progressData = await studentApi.getProgress(studentId);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const handleStartGame = async () => {
    if (!studentId) return;

    setIsLoading(true);

    try {
      const session = await gameApi.startSession(studentId);
      setSession(session);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('게임을 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          뇌 회복 미니 게임 🧠
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          간단한 산수 문제로 편안하게 쉬어가세요
        </p>

        {progress && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">나의 기록</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {progress.total_sessions}
                </div>
                <div className="text-sm text-gray-600">총 게임 횟수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {progress.total_problems_solved}
                </div>
                <div className="text-sm text-gray-600">푼 문제</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {progress.average_accuracy.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">평균 정확도</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleStartGame}
            disabled={isLoading}
            className="btn-primary w-full text-xl"
          >
            {isLoading ? '준비 중...' : '게임 시작하기 ▶'}
          </button>

          <p className="text-sm text-gray-500">
            * 이 게임은 집중 학습 후 뇌를 편안하게 쉬게 해줍니다
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">게임 특징</h3>
          <ul className="text-left text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>스트레스 없는 간단한 문제</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>자동으로 조절되는 난이도</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>긍정적인 피드백</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>3-5분 짧은 세션</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
