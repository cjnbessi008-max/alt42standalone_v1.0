import { useState, useEffect } from 'react';
import { problemsAPI, studentProgressAPI } from './api';
import ProblemSolver from './components/ProblemSolver';
import StudentProgress from './components/StudentProgress';

function App() {
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const response = await problemsAPI.getAll();
      if (response.data.success) {
        setProblems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
      alert('문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleProblemSelect = (problem) => {
    setCurrentProblem(problem);
    setShowProgress(false);
  };

  const handleProblemComplete = () => {
    setCurrentProblem(null);
    loadProblems();
  };

  const handleShowProgress = () => {
    setShowProgress(true);
    setCurrentProblem(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            실수 유형 학습 시스템
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름을 입력하세요
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              시작하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentProblem) {
    return (
      <ProblemSolver
        problem={currentProblem}
        studentName={studentName}
        onComplete={handleProblemComplete}
        onBack={() => setCurrentProblem(null)}
      />
    );
  }

  if (showProgress) {
    return (
      <StudentProgress
        studentName={studentName}
        onBack={() => setShowProgress(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              실수 유형 학습 시스템
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">안녕하세요, {studentName}님</span>
              <button
                onClick={handleShowProgress}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                내 학습 현황
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setStudentName('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">문제 목록</h2>
          <p className="text-gray-600">문제를 선택하여 풀어보세요!</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">문제를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200 cursor-pointer"
                onClick={() => handleProblemSelect(problem)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {problem.title}
                  </h3>
                  <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    난이도 {problem.difficulty_level}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{problem.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase">
                    {problem.problem_type}
                  </span>
                  <button className="text-blue-500 hover:text-blue-700 font-medium text-sm">
                    풀어보기 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && problems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">문제가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
