import { useState, useEffect } from 'react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { BoxplotSnap } from './components/BoxplotSnap';
import { MockLMSService } from './services/mockLMS';
import type { ProblemData } from './services/mockLMS';
import { motion } from 'framer-motion';

function App() {
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LMS에서 문제 데이터 로드
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await MockLMSService.getAllProblems();
      setProblems(data);
      if (data.length > 0) {
        setSelectedProblem(data[0]);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 메인 컨텐츠 영역 */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Boxplot Snap
          </h1>
          <p className="text-gray-600 mb-8">
            LMS 연동 상자그림 시각화 - 부드러운 애니메이션과 함께
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 문제 목록 */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  📚 문제 목록
                </h2>
                <div className="space-y-3">
                  {problems.map((problem, index) => (
                    <motion.button
                      key={problem.id}
                      onClick={() => setSelectedProblem(problem)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedProblem?.id === problem.id
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="font-semibold">{problem.title}</div>
                      <div className="text-sm mt-1 opacity-80">
                        {problem.description}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* LMS 연동 정보 */}
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  🔗 LMS 연동 상태
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Moodle 버전:</span>
                    <span className="font-semibold text-green-600">3.7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">PHP 버전:</span>
                    <span className="font-semibold text-green-600">7.1.9</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">MySQL 버전:</span>
                    <span className="font-semibold text-green-600">5.7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">연결 상태:</span>
                    <span className="flex items-center text-green-600 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      연결됨
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* 상세 정보 영역 */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {selectedProblem ? (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    {selectedProblem.title}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {selectedProblem.description}
                  </p>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      📈 통계 정보
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">최솟값</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProblem.boxplotData.min}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">1사분위수</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProblem.boxplotData.q1}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">중앙값</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedProblem.boxplotData.median}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">3사분위수</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProblem.boxplotData.q3}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">최댓값</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProblem.boxplotData.max}
                        </div>
                      </div>
                    </div>

                    {selectedProblem.studentScores && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">
                          학생 점수 데이터 ({selectedProblem.studentScores.length}명)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProblem.studentScores.map((score, idx) => (
                            <motion.span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.02 }}
                            >
                              {score}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
                  문제를 선택해주세요
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* 우측 하단 스마트폰 시뮬레이터 */}
      {selectedProblem && (
        <PhoneSimulator position="bottom-right">
          <div className="p-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                모바일 앱 미리보기
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedProblem.title}
              </p>
            </div>
            <BoxplotSnap
              data={selectedProblem.boxplotData}
              color="#3b82f6"
            />
          </div>
        </PhoneSimulator>
      )}
    </div>
  );
}

export default App;
