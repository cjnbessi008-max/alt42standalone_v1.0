import { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import FunctionGraph from './components/FunctionGraph';
import type { Term } from './components/FunctionGraph';
import TermControl from './components/TermControl';
import { moodleApi } from './services/moodleApi';
import type { MoodleProblem } from './services/moodleApi';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MoodleProblem | null>(null);
  const [showProblem, setShowProblem] = useState(false);
  const [problems, setProblems] = useState<MoodleProblem[]>([]);

  // 초기 로드: Mock 문제 가져오기
  useEffect(() => {
    const mockProblems = moodleApi.getMockProblems();
    setProblems(mockProblems);
  }, []);

  const handleAddTerm = (term: Term) => {
    setTerms([...terms, term]);
  };

  const handleReset = () => {
    setTerms([]);
  };

  const handleLoadProblem = (problem: MoodleProblem) => {
    setCurrentProblem(problem);
    setTerms([]);
    setShowProblem(false);
  };

  const handleLoadProblemTerms = () => {
    if (currentProblem) {
      setTerms(currentProblem.terms);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentProblem) return;

    // 간단한 정답 확인 로직
    const isCorrect = JSON.stringify(terms.sort((a, b) => b.power - a.power)) ===
                      JSON.stringify(currentProblem.terms.sort((a, b) => b.power - a.power));

    if (isCorrect) {
      alert('🎉 정답입니다! 완벽하게 함수를 만들었어요!');
    } else {
      alert('조금 더 생각해보세요. 힌트를 참고하세요!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        {/* Control Panel */}
        <TermControl
          onAddTerm={handleAddTerm}
          onReset={handleReset}
          currentTerms={terms}
        />

        {/* Problem Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📚 Moodle 문제 불러오기
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => handleLoadProblem(problem)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    currentProblem?.id === problem.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <h4 className="font-semibold text-gray-800 mb-2">{problem.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{problem.description}</p>
                </button>
              ))}
            </div>

            {/* Problem Details */}
            <AnimatePresence>
              {currentProblem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">
                    선택된 문제: {currentProblem.title}
                  </h4>
                  <p className="text-gray-700 mb-3">{currentProblem.description}</p>

                  {currentProblem.hints && currentProblem.hints.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setShowProblem(!showProblem)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        💡 {showProblem ? '힌트 숨기기' : '힌트 보기'}
                      </button>

                      <AnimatePresence>
                        {showProblem && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1"
                          >
                            {currentProblem.hints.map((hint, index) => (
                              <p key={index} className="text-sm text-gray-600 pl-4">
                                • {hint}
                              </p>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadProblemTerms}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      정답 보기 (학습용)
                    </button>
                    <button
                      onClick={handleCheckAnswer}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      내 답안 확인
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 max-w-4xl mx-auto text-center text-sm text-gray-500"
        >
          <p>
            👉 우측 하단의 스마트폰 화면에서 그래프가 실시간으로 성장하는 모습을 확인하세요!
          </p>
        </motion.div>
      </div>

      {/* Smartphone Display (Fixed at bottom-right) */}
      <SmartphoneFrame>
        <FunctionGraph terms={terms} showAnimation={true} />
      </SmartphoneFrame>
    </div>
  );
}

export default App;
