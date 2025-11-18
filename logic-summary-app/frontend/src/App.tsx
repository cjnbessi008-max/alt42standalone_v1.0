import { useState } from 'react';
import { ProblemInput } from './components/ProblemInput';
import { LogicSummary } from './components/LogicSummary';
import { VirtualPhone } from './components/VirtualPhone';
import { problemsApi } from './api/client';
import { ProblemCreate, LogicSummaryResponse } from './types';
import './index.css';

function App() {
  const [summary, setSummary] = useState<LogicSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProblemSubmit = async (problemData: ProblemCreate) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create the problem
      const createdProblem = await problemsApi.create(problemData);
      console.log('Problem created:', createdProblem);

      // Analyze the problem
      const analysisResult = await problemsApi.analyze(createdProblem.id);
      console.log('Analysis result:', analysisResult);

      setSummary(analysisResult);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error
          ? err.message
          : '문제 분석 중 오류가 발생했습니다. / An error occurred during analysis.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🧠 Logic Summary
            <span className="text-lg font-normal text-gray-600 ml-3">
              논리 명제 자동 요약 시스템
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered logical proposition extraction and summarization
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Problem Input */}
          <div>
            <ProblemInput onSubmit={handleProblemSubmit} isLoading={isLoading} />

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 사용 방법 / How to Use</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>문제의 제목과 내용을 입력하세요</li>
                <li>문제 유형과 학년을 선택하세요 (선택사항)</li>
                <li>'문제 제출 및 분석' 버튼을 클릭하세요</li>
                <li>AI가 논리 명제를 자동으로 추출합니다</li>
                <li>우측 하단의 가상 스마트폰에서도 결과를 확인할 수 있습니다</li>
              </ol>
            </div>
          </div>

          {/* Right: Logic Summary */}
          <div>
            <LogicSummary summary={summary} />
          </div>
        </div>

        {/* Example Problems */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">
            📚 예제 문제 / Example Problems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded p-4 hover:border-primary-500 transition-colors cursor-pointer"
                 onClick={() => handleProblemSubmit({
                   title: "분수 덧셈 문제",
                   content: "만약 피자의 1/4를 먹고 친구가 2/4를 더 주면, 전체 피자의 몇 분의 몇을 갖게 되나요?",
                   problem_type: "math",
                   grade_level: "3학년"
                 })}>
              <h4 className="font-semibold text-sm text-gray-800 mb-1">분수 덧셈</h4>
              <p className="text-xs text-gray-600">
                분수의 개념과 덧셈 연산을 포함한 기초 수학 문제
              </p>
            </div>

            <div className="border border-gray-200 rounded p-4 hover:border-primary-500 transition-colors cursor-pointer"
                 onClick={() => handleProblemSubmit({
                   title: "논리 추론 문제",
                   content: "모든 고양이는 동물이다. 뭉치는 고양이다. 따라서 뭉치는 무엇인가?",
                   problem_type: "logic",
                   grade_level: "5학년"
                 })}>
              <h4 className="font-semibold text-sm text-gray-800 mb-1">삼단논법</h4>
              <p className="text-xs text-gray-600">
                전제와 결론을 포함한 기본 논리 추론 문제
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Virtual Phone Display (bottom right) */}
      <VirtualPhone summary={summary} />

      {/* Footer */}
      <footer className="mt-16 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Logic Summary v1.0 | Powered by Claude AI | Built with React + FastAPI</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
