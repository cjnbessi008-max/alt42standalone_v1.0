import { useState, useEffect } from 'react';
import type { ProblemSolvingStage, ProblemType, SubmitAnswerResponse } from '../types';

interface SolvingStageProps {
  problem: ProblemSolvingStage;
  onSubmitAnswer: (answer: string, timeSpent: number) => Promise<SubmitAnswerResponse>;
}

export const SolvingStage: React.FC<SolvingStageProps> = ({
  problem,
  onSubmitAnswer,
}) => {
  const [answer, setAnswer] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onSubmitAnswer(answer, elapsedTime);
      setResult(response);

      if (!response.is_correct) {
        setAnswer(''); // Clear answer for retry
      }
    } catch (error) {
      console.error('Answer submission error:', error);
      alert('답안 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAnswerInput = () => {
    if (problem.problem_type === 'multiple_choice' && problem.answer_options) {
      return (
        <div className="space-y-3">
          {Object.entries(problem.answer_options).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <input
                type="radio"
                name="answer"
                value={key}
                checked={answer === key}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-3 text-lg">
                <span className="font-semibold">{key}.</span> {value}
              </span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="input min-h-32 resize-y"
        placeholder="답을 입력하세요..."
        disabled={isSubmitting || (result?.is_correct ?? false)}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{problem.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">풀이 시간</div>
            <div className="text-2xl font-mono font-bold text-primary-600">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        {/* Stage indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="font-semibold text-green-600">읽기 완료</span>
          </div>
          <div className="flex-1 h-1 bg-primary-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="font-semibold text-primary-600">풀이 단계</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">문제</h2>
        <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
          {problem.question_text}
        </p>
      </div>

      {/* Answer Form */}
      {!result?.is_correct && (
        <form onSubmit={handleSubmit} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">답안 작성</h3>
          {renderAnswerInput()}

          {result && !result.is_correct && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">
                틀렸습니다. 다시 시도해보세요!
              </p>
              <p className="text-red-600 text-sm mt-1">
                시도 횟수: {result.attempt_number}회
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !answer.trim()}
            className="btn-primary w-full mt-6 text-lg py-3"
          >
            {isSubmitting ? '제출 중...' : '답안 제출'}
          </button>
        </form>
      )}

      {/* Success Result */}
      {result?.is_correct && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-green-500 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">정답입니다!</h3>
            <p className="text-green-700">
              {result.attempt_number}번 만에 맞추셨습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">정답</h4>
            <p className="text-lg text-gray-700">{result.correct_answer}</p>
          </div>

          {result.explanation && (
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">설명</h4>
              <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/problems'}
              className="btn-primary text-lg px-8 py-3"
            >
              다른 문제 풀기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
