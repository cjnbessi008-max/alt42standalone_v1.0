import { useState, useEffect } from 'react';
import { VirtualPhone } from './components/VirtualPhone/VirtualPhone';
import { ProblemDisplay } from './components/ProblemDisplay/ProblemDisplay';
import { EquationSummary } from './components/EquationSummary/EquationSummary';
import { apiService } from './services/api';
import { ProblemWithSummary } from './types';

function App() {
  const [data, setData] = useState<ProblemWithSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isHealthy, setIsHealthy] = useState(false);

  // Health check on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const healthy = await apiService.healthCheck();
      setIsHealthy(healthy);
    } catch {
      setIsHealthy(false);
    }
  };

  const handleFetchQuestion = async () => {
    if (!questionId.trim()) {
      setError('문제 ID를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getQuestionWithSummary(parseInt(questionId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomSummary = async () => {
    if (!customText.trim()) {
      setError('문제 내용을 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.generateSummary(customText);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요약 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Alt42 - Moodle LMS 연동
          </h1>
          <p className="text-gray-600">
            문제를 AI로 분석하고 3줄 요약을 생성합니다
          </p>
          <div className="mt-2 flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm text-gray-500">
              {isHealthy ? '서버 연결됨' : '서버 연결 안됨'}
            </span>
          </div>
        </header>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1. Moodle에서 문제 가져오기
            </h2>
            <div className="flex space-x-2">
              <input
                type="number"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="문제 ID 입력 (예: 123)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleFetchQuestion}
                disabled={loading || !isHealthy}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '로딩 중...' : '문제 불러오기'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              2. 직접 입력한 문제 요약하기
            </h2>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="문제 내용을 입력하세요... (LaTeX 수식도 가능합니다. 예: $x^2 + y^2 = r^2$)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <button
              onClick={handleGenerateCustomSummary}
              disabled={loading || !isHealthy}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '생성 중...' : 'AI 요약 생성'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Desktop Preview (Optional) */}
        {data && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              데스크톱 미리보기
            </h2>
            <div className="space-y-6">
              <ProblemDisplay problem={data.problem} />
              <EquationSummary summary={data.summary} isLoading={loading} />
            </div>
          </div>
        )}
      </div>

      {/* Virtual Phone Display */}
      <VirtualPhone>
        {data ? (
          <div className="space-y-4">
            <ProblemDisplay problem={data.problem} />
            <EquationSummary summary={data.summary} isLoading={loading} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              문제를 불러오거나 입력하면
              <br />
              여기에 표시됩니다
            </p>
          </div>
        )}
      </VirtualPhone>
    </div>
  );
}

export default App;
