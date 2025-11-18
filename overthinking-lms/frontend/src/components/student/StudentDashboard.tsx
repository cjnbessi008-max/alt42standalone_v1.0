import { useState, useEffect } from 'react';
import { problemsAPI } from '../../services/api';
import type { User, Problem } from '../../types';
import ProblemSolver from './ProblemSolver';
import { LogOut, BookOpen } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const data = await problemsAPI.getAll({ limit: 20 });
      setProblems(data);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedProblem) {
    return (
      <ProblemSolver
        problem={selectedProblem}
        student={user}
        onBack={() => setSelectedProblem(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학습하기</h1>
              <p className="text-sm text-gray-600 mt-1">{user.name}님 환영합니다</p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">문제를 불러오는 중...</div>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 문제가 없습니다</h3>
            <p className="text-gray-600">선생님이 문제를 추가할 때까지 기다려주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => setSelectedProblem(problem)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {problem.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      problem.difficultyLevel <= 2
                        ? 'bg-green-100 text-green-800'
                        : problem.difficultyLevel <= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    난이도 {problem.difficultyLevel}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {problem.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>유형: {problem.problemType}</span>
                  <span>평균 {Math.floor(problem.avgSolveTimeSeconds / 60)}분</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
