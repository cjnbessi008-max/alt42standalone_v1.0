/**
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartphoneScreen from '@components/SmartphoneScreen';
import QuestionDisplay from '@components/QuestionDisplay';
import { useAppStore } from '@stores/appStore';
import { useProgressStore } from '@stores/progressStore';
import { apiService } from '@services/api';
import type { Question } from '@types/index';

const App: React.FC = () => {
  const {
    currentQuestion,
    currentStudent,
    sessionId,
    isLoading,
    error,
    setCurrentQuestion,
    setCurrentStudent,
    setSessionId,
    setLoading,
    setError,
  } = useAppStore();

  const { startProgress, completeProgress } = useProgressStore();

  const [showWelcome, setShowWelcome] = useState(true);

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);

      // Create mock student (in production, this would come from Moodle)
      const mockStudent = {
        id: 1,
        moodle_user_id: 1,
        username: 'student_demo',
        full_name: '데모 학생',
        email: 'demo@example.com',
        grade_level: '중학교 1학년',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentStudent(mockStudent);

      // Create session
      const session = await apiService.createSession(mockStudent.id);
      setSessionId(session.session_id);
      localStorage.setItem('session_id', session.session_id);

      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError('세션 초기화에 실패했습니다.');
      setLoading(false);
    }
  };

  const loadNewQuestion = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get random question
      const question = await apiService.getRandomQuestion({
        difficulty: 3, // Medium difficulty
      });

      setCurrentQuestion(question);

      // Start progress tracking
      if (currentStudent && sessionId) {
        startProgress(currentStudent.id, question.id, sessionId);
      }

      setShowWelcome(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      setError('문제를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleAnswer = (answer: Record<string, any>) => {
    console.log('User answer:', answer);
  };

  const handleComplete = async (isCorrect: boolean) => {
    await completeProgress(isCorrect);

    // Show result for a moment, then load next question
    setTimeout(() => {
      loadNewQuestion();
    }, 3000);
  };

  const handleStartClick = () => {
    loadNewQuestion();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Logical Linker
          </h1>
          <p className="text-gray-600">논리연결사 학습 시스템</p>
        </motion.header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
          >
            <strong className="font-bold">오류!</strong>
            <span className="block sm:inline"> {error}</span>
          </motion.div>
        )}

        {/* Welcome Screen */}
        {showWelcome && !isLoading && !currentQuestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              논리연결사를 배워볼까요?
            </h2>
            <p className="text-gray-600 mb-6">
              그리고, 또는, 이면 - 세 가지 논리연결사의 의미를 애니메이션으로 이해하고
              문제를 풀어보세요!
            </p>

            {currentStudent && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">환영합니다!</p>
                <p className="font-semibold text-gray-800">
                  {currentStudent.full_name || currentStudent.username}
                </p>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartClick}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white
                         px-8 py-4 rounded-full font-bold text-lg shadow-lg
                         hover:shadow-xl transition-all"
            >
              시작하기 🚀
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Smartphone Screen with Question */}
      <AnimatePresence>
        {currentQuestion && !isLoading && (
          <SmartphoneScreen>
            <QuestionDisplay
              question={currentQuestion}
              onAnswer={handleAnswer}
              onComplete={handleComplete}
            />
          </SmartphoneScreen>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-2 left-2 text-sm text-gray-500">
        <p>Powered by Moodle LMS • KAIST Touch Math Academy</p>
      </footer>
    </div>
  );
};

export default App;
