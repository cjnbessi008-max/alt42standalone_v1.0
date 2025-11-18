/**
 * Problem View Component
 * Displays the problem and student's work area
 */
import { useState } from 'react';
import type { Problem } from '../types';

interface ProblemViewProps {
  problem: Problem;
  studentWork: string;
  onStudentWorkChange: (work: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ProblemView({
  problem,
  studentWork,
  onStudentWorkChange,
  onSubmit,
  isSubmitting,
}: ProblemViewProps) {
  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyLabel = (difficulty: string): string => {
    const labels: Record<string, string> = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Problem Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{problem.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getDifficultyColor(
              problem.difficulty
            )}`}
          >
            {getDifficultyLabel(problem.difficulty)}
          </span>
        </div>

        {problem.grade_level && (
          <div className="text-sm text-gray-600">
            학년: {problem.grade_level}
          </div>
        )}
      </div>

      {/* Problem Description */}
      <div className="border-l-4 border-blue-500 pl-4 py-2">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">문제</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </p>
      </div>

      {/* Work Area */}
      <div className="space-y-3">
        <label
          htmlFor="student-work"
          className="block text-lg font-semibold text-gray-800"
        >
          풀이 과정
        </label>
        <textarea
          id="student-work"
          value={studentWork}
          onChange={(e) => onStudentWorkChange(e.target.value)}
          placeholder="여기에 문제를 풀어보세요...&#10;&#10;힌트가 필요하면 오른쪽의 '힌트 받기' 버튼을 눌러주세요."
          className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none font-mono"
        />
        <p className="text-sm text-gray-500">
          풀이 과정을 자세히 작성하면 더 적절한 힌트를 받을 수 있습니다.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !studentWork.trim()}
          className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {isSubmitting ? '제출 중...' : '답안 제출'}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">학습 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 먼저 문제를 천천히 읽어보세요</li>
          <li>• 알고 있는 개념이 무엇인지 생각해보세요</li>
          <li>• 막히는 부분이 있다면 힌트를 요청하세요</li>
          <li>• 힌트는 답을 알려주지 않고 생각하는 방향을 안내합니다</li>
        </ul>
      </div>
    </div>
  );
}
