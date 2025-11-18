import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { ProblemInput } from './components/ProblemInput';
import { StrategyTree } from './components/StrategyTree';
import { generateStrategy, getDemoStrategy } from './services/api';
import { StrategyResponse } from './types';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null);

  const handleSubmit = async (problem: string, subject: string) => {
    setLoading(true);
    setError(null);
    setStrategy(null);

    try {
      const response = await generateStrategy({ problem, subject });
      setStrategy(response);
    } catch (err) {
      console.error('Error generating strategy:', err);
      setError(
        'AI 전략 생성에 실패했습니다. API 키가 설정되어 있는지 확인하세요. 데모 버튼을 눌러 예제를 확인할 수 있습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    setStrategy(null);

    try {
      const response = await getDemoStrategy();
      setStrategy(response);
    } catch (err) {
      console.error('Error loading demo:', err);
      setError('데모를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStrategy(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                문제 해결 전략 시각화
              </h1>
            </div>

            <div className="flex gap-2">
              {strategy && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700
                           text-gray-700 dark:text-gray-300 hover:bg-gray-300
                           dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  새로운 문제
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDemo}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-purple-600 dark:bg-purple-500
                         text-white hover:bg-purple-700 dark:hover:bg-purple-600
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                데모 보기
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!strategy ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProblemInput onSubmit={handleSubmit} loading={loading} />

              {/* 안내 정보 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 max-w-3xl mx-auto"
              >
                <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                    이 도구는 무엇인가요?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      AI가 문제를 분석하고 단계별 해결 전략을 생성합니다
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      각 단계는 말풍선 형태로 시각화되어 이해하기 쉽습니다
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      말풍선을 클릭하면 세부 내용을 확인할 수 있습니다
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      화살표를 클릭하면 하위 단계를 펼치거나 접을 수 있습니다
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="strategy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 문제 표시 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  문제
                </h3>
                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                  {strategy.problem}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  총 {strategy.total_steps}개의 단계
                </p>
              </motion.div>

              {/* 전략 트리 */}
              <StrategyTree steps={strategy.steps} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mt-6"
            >
              <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 로딩 상태 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                전략을 생성하고 있습니다...
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="mt-16 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>AI 기반 문제 해결 전략 시각화 도구</p>
      </footer>
    </div>
  );
}

export default App;
