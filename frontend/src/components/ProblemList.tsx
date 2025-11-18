import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Problem } from '../types';

const ProblemList: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodleConnected, setMoodleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    loadProblems();
    checkMoodleConnection();
  }, []);

  const loadProblems = async () => {
    try {
      const data = await api.getAllProblems();
      setProblems(data);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMoodleConnection = async () => {
    try {
      const connected = await api.testMoodleConnection();
      setMoodleConnected(connected);
    } catch (err) {
      setMoodleConnected(false);
    }
  };

  const getProblemTypeIcon = (type: string) => {
    switch (type) {
      case 'probability_tree':
        return '🎲';
      case 'combination_tree':
        return '🔢';
      case 'factorization_tree':
        return '📊';
      default:
        return '🌳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문제 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dynamic Tree</h1>
          <p className="text-gray-600">KAIST Touch Math Academy - Moodle LMS 연동</p>

          {/* Moodle Connection Status */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm">
            <div className={`w-3 h-3 rounded-full ${moodleConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Moodle: {moodleConnected === null ? '확인 중...' : moodleConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
        </div>

        {/* Problem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => navigate(`/problem/${problem.id}`)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{getProblemTypeIcon(problem.problem_type)}</div>
                  <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                    난이도 {problem.difficulty_level}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {problem.description || '설명이 없습니다.'}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {problem.problem_type.replace('_', ' ')}
                  </span>
                  <span>Moodle Quiz #{problem.moodle_quiz_id}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(problem.created_at).toLocaleDateString('ko-KR')}
                </span>
                <button className="text-sm text-blue-600 font-medium hover:underline">
                  시작하기 →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {problems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌳</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">문제가 없습니다</h3>
            <p className="text-gray-500">Moodle에서 퀴즈를 동기화하여 문제를 생성하세요.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2024 KAIST Touch Math Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ProblemList;
