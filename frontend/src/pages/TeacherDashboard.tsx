/**
 * Teacher Dashboard
 * Monitoring interface for teachers to track student progress
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TeacherDashboardData, DifficultyLevel, StudentProgress } from '@shared/types';

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

const TREND_ICONS = {
  improving: '📈',
  stable: '➡️',
  declining: '📉',
};

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor student progress and performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.totalStudents}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.activeStudents}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Performance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.averagePerformance.toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Difficulty Distribution</h2>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(dashboardData.difficultyDistribution).map(([level, count]) => (
              <div key={level} className="text-center">
                <div className={`py-3 px-4 rounded-lg ${DIFFICULTY_COLORS[parseInt(level) as DifficultyLevel]}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm mt-1">{DIFFICULTY_LABELS[parseInt(level) as DifficultyLevel]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Student Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problems
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.students.map((studentProgress) => {
                  const student = studentProgress.student;
                  const metrics = studentProgress.performanceMetrics;
                  const accuracy = student.totalProblemsAttempted > 0
                    ? (student.totalCorrect / student.totalProblemsAttempted) * 100
                    : 0;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedStudent(studentProgress)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DIFFICULTY_COLORS[student.currentDifficulty]}`}>
                          {DIFFICULTY_LABELS[student.currentDifficulty]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.totalProblemsAttempted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accuracy.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(student.averageSolveTime)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="flex items-center">
                          {TREND_ICONS[metrics.recentPerformanceTrend]}
                          <span className="ml-1 capitalize">{metrics.recentPerformanceTrend}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {student.performanceScore.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
               onClick={() => setSelectedStudent(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedStudent.student.name}
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Recent Attempts */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Recent Attempts</h4>
                <div className="space-y-2">
                  {selectedStudent.recentAttempts.slice(0, 5).map((attempt, index) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">
                        {new Date(attempt.attemptedAt).toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{attempt.timeSpent}s</span>
                        <span className={`font-semibold ${attempt.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {attempt.isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty History */}
              {selectedStudent.difficultyHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Difficulty Adjustments</h4>
                  <div className="space-y-3">
                    {selectedStudent.difficultyHistory.map((adjustment, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {DIFFICULTY_LABELS[adjustment.previousDifficulty]} → {DIFFICULTY_LABELS[adjustment.newDifficulty]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(adjustment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{adjustment.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
