import { useState } from 'react';
import { attemptsAPI } from '../api';
import MistakeCategorySelector from './MistakeCategorySelector';

function ProblemSolver({ problem, studentName, onComplete, onBack }) {
  const [answer, setAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showMistakeSelector, setShowMistakeSelector] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!answer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await attemptsAPI.submit({
        student_name: studentName,
        problem_id: problem.id,
        student_answer: answer,
        time_spent_seconds: timeSpent,
      });

      if (response.data.success) {
        setResult(response.data.data);

        // If incorrect, show mistake category selector
        if (!response.data.data.is_correct) {
          setShowMistakeSelector(true);
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('답안 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMistakeSelectionComplete = () => {
    setShowMistakeSelector(false);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleSkipMistakeSelection = () => {
    setShowMistakeSelector(false);
    onComplete();
  };

  if (showMistakeSelector && result) {
    return (
      <MistakeCategorySelector
        attemptId={result.attempt_id}
        suggestedCategories={result.suggested_categories}
        onComplete={handleMistakeSelectionComplete}
        onSkip={handleSkipMistakeSelection}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{problem.title}</h1>
              <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                난이도 {problem.difficulty_level}
              </span>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답안 입력
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="답을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 text-lg"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {result.is_correct ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">✅</span>
                    <h3 className="text-xl font-bold text-green-800">정답입니다!</h3>
                  </div>
                  <p className="text-green-700 ml-12">
                    훌륭해요! 다음 문제로 넘어가세요.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">❌</span>
                    <h3 className="text-xl font-bold text-red-800">틀렸습니다</h3>
                  </div>
                  <div className="ml-12 space-y-2">
                    <p className="text-red-700">
                      <span className="font-semibold">내 답:</span> {answer}
                    </p>
                    <p className="text-red-700">
                      <span className="font-semibold">정답:</span> {result.correct_answer}
                    </p>
                  </div>
                </div>
              )}

              {result.is_correct ? (
                <button
                  onClick={onComplete}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 text-lg"
                >
                  다음 문제로
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-yellow-800 text-center mb-4">
                    실수 유형을 선택하여 학습 개선에 도움을 주세요!
                  </p>
                  <button
                    onClick={() => setShowMistakeSelector(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                  >
                    실수 유형 선택하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProblemSolver;
