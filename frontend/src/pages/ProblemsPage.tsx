import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import { Problem } from '../types';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemsAPI.list();
      setProblems(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-orange-100 text-orange-800';
      case 'EXPERT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '쉬움';
      case 'MEDIUM': return '보통';
      case 'HARD': return '어려움';
      case 'EXPERT': return '고급';
      default: return difficulty;
    }
  };

  const getSubjectText = (subject: string) => {
    switch (subject) {
      case 'MATHEMATICS': return '수학';
      case 'PHYSICS': return '물리';
      case 'CHEMISTRY': return '화학';
      case 'PROGRAMMING': return '프로그래밍';
      case 'LOGIC': return '논리';
      default: return subject;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">문제 목록</h1>
          <p className="mt-2 text-sm text-gray-700">
            아래 문제 중 하나를 선택하여 풀어보세요. AI가 여러분의 풀이를 분석합니다.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {problems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">아직 등록된 문제가 없습니다.</p>
          </div>
        ) : (
          problems.map((problem) => (
            <div
              key={problem.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                    {getDifficultyText(problem.difficulty)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getSubjectText(problem.subject)}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {problem.description}
                </p>
                <Link
                  to={`/problems/${problem.id}/solve`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  풀어보기
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
