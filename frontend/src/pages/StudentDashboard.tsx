import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학생 대시보드</h1>
              <p className="text-sm text-gray-600">안녕하세요, {user?.name}님</p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Modules */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">내 수강 과목</h2>
            <div className="space-y-3">
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer">
                <h3 className="font-semibold text-gray-900">분수 학습 모듈</h3>
                <p className="text-sm text-gray-600 mt-1">
                  5학년을 위한 분수 이해 및 계산 학습
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">진행률: 45%</span>
                  <span className="text-primary-600 font-medium">계속하기 →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Focus Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘의 집중도</h2>
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
                <span className="text-4xl">🎯</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">85%</p>
              <p className="text-sm text-gray-600 mt-1">평균 집중도</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-600">학습 세션</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">45분</p>
                <p className="text-xs text-gray-600">총 학습 시간</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">분수 덧셈 문제 완료</p>
                <p className="text-sm text-gray-600">2시간 전</p>
              </div>
              <span className="text-sm text-green-600 font-medium">100% 정확도</span>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">새 모듈 등록</p>
                <p className="text-sm text-gray-600">어제</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 학습 팁</h3>
          <p className="text-sm text-blue-800">
            규칙적인 휴식을 취하면 집중력이 향상됩니다. 25분 학습 후 5분 휴식을 추천합니다!
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
