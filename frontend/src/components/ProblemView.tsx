/**
 * ProblemView Component - 문제 표시 및 팁 요청
 */
import React, { useState, useEffect } from 'react';
import type { Problem, TipResponse, TipRequest } from '../types';
import { api } from '../services/api';
import TipDisplay from './TipDisplay';

interface ProblemViewProps {
  problem: Problem;
  studentId: string;
  onSubmitAnswer?: (answer: any, isCorrect: boolean) => void;
}

const ProblemView: React.FC<ProblemViewProps> = ({
  problem,
  studentId,
  onSubmitAnswer,
}) => {
  const [answer, setAnswer] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [tipResponse, setTipResponse] = useState<TipResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState<any[]>([]);
  const [startTime] = useState(Date.now());

  // 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // 팁 요청
  const requestTip = async () => {
    setLoading(true);
    try {
      const request: TipRequest = {
        student_id: studentId,
        problem_id: problem.id,
        current_attempt_number: attemptNumber,
        time_spent_seconds: timeSpent,
        previous_answers: previousAnswers,
      };

      const response = await api.requestTip(request);
      setTipResponse(response);
      setShowTip(true);
    } catch (error) {
      console.error('팁 요청 실패:', error);
      alert('팁을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 답안 제출
  const handleSubmit = () => {
    if (!answer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    // 실제로는 서버에서 정답 확인
    const isCorrect = false; // 임시

    setPreviousAnswers([...previousAnswers, { answer, timestamp: Date.now() }]);
    setAttemptNumber(attemptNumber + 1);

    if (onSubmitAnswer) {
      onSubmitAnswer(answer, isCorrect);
    }

    if (!isCorrect) {
      alert('틀렸습니다. 다시 시도해보세요.');
      setAnswer('');
    } else {
      alert('정답입니다! 🎉');
    }
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="problem-view max-w-4xl mx-auto p-6">
      {/* 문제 정보 */}
      <div className="problem-header bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{problem.title}</h2>
            <div className="flex gap-2 items-center text-sm text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded">
                난이도: {'⭐'.repeat(problem.difficulty_level)}
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded">
                시도: {attemptNumber}회
              </span>
              <span className="bg-green-100 px-2 py-1 rounded">
                시간: {formatTime(timeSpent)}
              </span>
            </div>
          </div>
          <button
            onClick={requestTip}
            disabled={loading}
            className={`
              px-4 py-2 rounded font-semibold transition
              ${loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }
            `}
          >
            {loading ? '로딩중...' : '💡 힌트 보기'}
          </button>
        </div>

        {/* 문제 내용 */}
        <div className="problem-content bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-gray-700 leading-relaxed">
            {problem.content.description || '문제 내용'}
          </div>
        </div>

        {/* 답안 입력 */}
        <div className="answer-section">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            답안 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="답을 입력하세요..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              제출
            </button>
          </div>
        </div>

        {/* 이전 시도 내역 */}
        {previousAnswers.length > 0 && (
          <div className="previous-attempts mt-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                이전 시도 내역 ({previousAnswers.length}개)
              </summary>
              <div className="mt-2 space-y-1">
                {previousAnswers.map((attempt, index) => (
                  <div key={index} className="bg-gray-100 rounded px-3 py-2">
                    <span className="font-semibold">시도 {index + 1}:</span> {attempt.answer}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* 팁 표시 */}
      {showTip && tipResponse && (
        <TipDisplay
          tipResponse={tipResponse}
          onFeedback={(wasHelpful, feedback) => {
            console.log('팁 피드백:', { wasHelpful, feedback });
          }}
          language="ko"
        />
      )}

      {/* 2회 이상 틀렸을 때 자동 팁 제안 */}
      {attemptNumber > 2 && !showTip && (
        <div className="auto-tip-suggestion bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 mb-2">
            💡 어려움을 겪고 계신가요? 힌트를 확인해보세요!
          </p>
          <button
            onClick={requestTip}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded transition"
          >
            힌트 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemView;
