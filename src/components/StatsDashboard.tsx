import React from 'react';
import { motion } from 'framer-motion';
import { getStats, formatTime, formatDate, resetStats } from '../utils/stats';
import { sampleFormulas } from '../utils/formulaParser';

interface StatsDashboardProps {
  onClose: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ onClose }) => {
  const stats = getStats();
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const handleReset = () => {
    if (showResetConfirm) {
      resetStats();
      setShowResetConfirm(false);
      window.location.reload();
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  // 완료율 계산
  const completionRate =
    sampleFormulas.length > 0
      ? Math.round((stats.formulasCompleted.length / sampleFormulas.length) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 학습 통계</h2>
              <p className="text-gray-600">당신의 학습 여정을 확인하세요</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 주요 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
            >
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-3xl font-bold mb-1">{stats.totalSessions}</div>
              <div className="text-blue-100 text-sm">총 학습 세션</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-3xl font-bold mb-1">{stats.totalFormulasLearned}</div>
              <div className="text-green-100 text-sm">완료한 공식</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
            >
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-3xl font-bold mb-1">{formatTime(stats.totalTimeSpent)}</div>
              <div className="text-purple-100 text-sm">총 학습 시간</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
            >
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-3xl font-bold mb-1">{completionRate}%</div>
              <div className="text-orange-100 text-sm">완료율</div>
            </motion.div>
          </div>

          {/* 진행률 바 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-100 rounded-xl p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">전체 진행률</h3>
              <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 mb-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {stats.formulasCompleted.length} / {sampleFormulas.length} 공식 완료
            </p>
          </motion.div>

          {/* 최근 학습 세션 */}
          {stats.recentSessions.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">📚 최근 학습 기록</h3>
              <div className="space-y-3">
                {stats.recentSessions.map((session, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-lg text-gray-800">{session.formulaText}</div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(session.startedAt)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>🔄 {session.cyclesCompleted} 반복</span>
                      <span>✓ {session.questionsAnswered} 질문</span>
                      {session.completedAt && (
                        <span>
                          ⏱️ {formatTime(session.completedAt - session.startedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 빈 상태 */}
          {stats.totalSessions === 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">아직 학습 기록이 없어요</h3>
              <p className="text-gray-600">공식을 선택해서 학습을 시작해보세요!</p>
            </motion.div>
          )}

          {/* 하단 버튼 */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              계속 학습하기
            </button>
            {stats.totalSessions > 0 && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  showResetConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showResetConfirm ? '정말 초기화?' : '통계 초기화'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
