import React, { useState } from 'react';
import { ProblemCreate } from '../types';

interface ProblemInputProps {
  onSubmit: (problem: ProblemCreate) => void;
  isLoading?: boolean;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProblemCreate>({
    title: '',
    content: '',
    problem_type: 'logic',
    grade_level: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        문제 입력 / Enter Problem
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            제목 / Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="예: 분수 덧셈 문제"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            문제 내용 / Problem Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="예: 만약 피자의 1/4를 먹고 친구가 2/4를 더 주면, 전체 피자의 몇 분의 몇을 갖게 되나요?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="problem_type" className="block text-sm font-medium text-gray-700 mb-1">
              문제 유형 / Type
            </label>
            <select
              id="problem_type"
              name="problem_type"
              value={formData.problem_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="logic">논리 / Logic</option>
              <option value="math">수학 / Math</option>
              <option value="reasoning">추론 / Reasoning</option>
            </select>
          </div>

          <div>
            <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1">
              학년 / Grade Level
            </label>
            <input
              type="text"
              id="grade_level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="예: 3학년"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '분석 중... / Analyzing...' : '문제 제출 및 분석 / Submit & Analyze'}
        </button>
      </form>
    </div>
  );
};
