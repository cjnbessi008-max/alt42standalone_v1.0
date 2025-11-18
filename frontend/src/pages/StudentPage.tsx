/**
 * Student Problem Solving Page
 * Main interface for students to solve problems with adaptive difficulty
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Problem, DifficultyLevel, PerformanceMetrics } from '@shared/types';

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.VERY_EASY]: 'Very Easy',
  [DifficultyLevel.EASY]: 'Easy',
  [DifficultyLevel.MEDIUM]: 'Medium',
  [DifficultyLevel.HARD]: 'Hard',
  [DifficultyLevel.VERY_HARD]: 'Very Hard',
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.VERY_EASY]: 'bg-green-100 text-green-800',
  [DifficultyLevel.EASY]: 'bg-blue-100 text-blue-800',
  [DifficultyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [DifficultyLevel.HARD]: 'bg-orange-100 text-orange-800',
  [DifficultyLevel.VERY_HARD]: 'bg-red-100 text-red-800',
};

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (studentId) {
      loadNextProblem();
    }
  }, [studentId]);

  const loadNextProblem = async () => {
    if (!studentId) return;

    setLoading(true);
    setFeedback(null);
    setAnswer('');

    try {
      const data = await api.getNextProblem(studentId);
      setProblem(data.problem);
      setCurrentDifficulty(data.currentDifficulty);
      setMetrics(data.studentMetrics);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading problem:', error);
      alert('Failed to load problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !problem || !answer.trim()) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setLoading(true);

    try {
      const response = await api.submitAnswer(studentId, {
        problemId: problem.id,
        answer: answer.trim(),
        timeSpent,
      });

      setFeedback({
        show: true,
        isCorrect: response.isCorrect,
        message: response.explanation || '',
      });

      setCurrentDifficulty(response.newDifficulty);
      setMetrics(response.performanceUpdate);

      // Auto-load next problem after showing feedback
      setTimeout(() => {
        if (response.nextProblem) {
          setProblem(response.nextProblem);
          setAnswer('');
          setFeedback(null);
          setStartTime(Date.now());
        } else {
          loadNextProblem();
        }
      }, 3000);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Adaptive Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Difficulty</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${DIFFICULTY_COLORS[currentDifficulty]}`}>
                  {DIFFICULTY_LABELS[currentDifficulty]}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {metrics && (
            <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(metrics.accuracyRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Problems Solved</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.totalProblems}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(metrics.averageSolveTime)}s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Problem */}
        {problem && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {problem.title}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {problem.description}
              </p>
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {problem.type === 'multiple_choice' && problem.options ? (
                <div className="space-y-2">
                  {problem.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={answer === option}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={loading || feedback?.show}
                      />
                      <span className="ml-3 text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || feedback?.show}
                />
              )}

              {/* Feedback */}
              {feedback?.show && (
                <div className={`p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                  <p className={`font-semibold ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {feedback.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className={`mt-1 ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {feedback.message}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Loading next problem...
                  </p>
                </div>
              )}

              {/* Submit Button */}
              {!feedback?.show && (
                <button
                  type="submit"
                  disabled={!answer.trim() || loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
              )}
            </form>

            {/* Hints */}
            {problem.hints && problem.hints.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <details className="cursor-pointer">
                  <summary className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                    💡 Need a hint?
                  </summary>
                  <div className="mt-2 space-y-2">
                    {problem.hints.map((hint, index) => (
                      <p key={index} className="text-sm text-gray-700 pl-4">
                        {index + 1}. {hint}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
