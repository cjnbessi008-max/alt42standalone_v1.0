import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Problem } from '../types';

export const ProblemsListPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setIsLoading(true);
      const data = await problemsAPI.getProblems();
      setProblems(data);
    } catch (error) {
      console.error('Failed to load problems:', error);
      alert('문제 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProblem = (problemId: string) => {
    navigate(`/problem/${problemId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">문제 목록</h1>
              <p className="text-sm text-gray-600 mt-1">
                환영합니다, <span className="font-semibold">{user?.full_name}</span>님!
              </p>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">문제 목록을 불러오는 중...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">아직 등록된 문제가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStartProblem(problem.id)}
              >
                {/* Problem Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {problem.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {problem.subject}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {problem.grade_level}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
                        problem.difficulty_level
                      )}`}
                    >
                      {getDifficultyText(problem.difficulty_level)}
                    </span>
                  </div>
                </div>

                {/* Problem Preview */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {problem.reading_content}
                </p>

                {/* Tags */}
                {problem.tags && problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{problem.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartProblem(problem.id);
                  }}
                  className="btn-primary w-full"
                >
                  문제 시작하기 →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
