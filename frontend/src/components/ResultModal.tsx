/**
 * Result modal component to show attempt feedback
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Attempt } from '../types';

interface ResultModalProps {
  attempt: Attempt | null;
  onClose: () => void;
  onNextProblem: () => void;
  onRetry: () => void;
  canRetry: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  attempt,
  onClose,
  onNextProblem,
  onRetry,
  canRetry,
}) => {
  if (!attempt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success/Failure Icon */}
          <div className="text-center mb-6">
            {attempt.is_correct ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600">Correct!</h2>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-3xl font-bold text-red-600">Not Quite</h2>
              </motion.div>
            )}
          </div>

          {/* Score */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-6 mb-6 text-center">
            <p className="text-sm opacity-90">Your Score</p>
            <p className="text-5xl font-bold">{attempt.score}</p>
            <p className="text-xs opacity-75 mt-2">
              Time: {attempt.time_spent_seconds || 0}s | Attempt #{attempt.attempt_number}
            </p>
          </div>

          {/* Feedback */}
          {attempt.feedback && (
            <div className="bg-blue-50 border-l-4 border-primary p-4 rounded mb-6">
              <p className="text-sm text-gray-700">{attempt.feedback}</p>
            </div>
          )}

          {/* Submitted Sequence */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Answer:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {attempt.submitted_sequence.map((value, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold ${
                    attempt.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canRetry && !attempt.is_correct && (
              <button
                onClick={onRetry}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Try Again
              </button>
            )}
            <button
              onClick={onNextProblem}
              className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {attempt.is_correct ? '➡️ Next Problem' : '⏭️ Skip'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
