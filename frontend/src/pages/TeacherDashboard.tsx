import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch modules
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await apiClient.get('/modules');
      // For now, use mock data since we haven't created the modules endpoint
      setModules([
        {
          id: '1',
          name: '분수 학습 모듈',
          description: '5학년을 위한 분수 이해 및 계산 학습',
          studentCount: 3,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
              <p className="text-sm text-gray-600">환영합니다, {user?.name}님</p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">내 모듈</h2>
              <div className="space-y-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedModule === module.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{module.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {module.studentCount}명 수강 중
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  산만함 감지 현황
                </h2>
                <p className="text-gray-600">
                  왼쪽에서 모듈을 선택하면 해당 모듈의 산만함 감지 현황을 확인할 수 있습니다.
                </p>
                <div className="mt-6">
                  <a
                    href={`/teacher/module/${selectedModule}/distractions`}
                    className="btn btn-primary"
                  >
                    산만함 이벤트 관리하기
                  </a>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    모듈을 선택하세요
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    왼쪽 목록에서 모듈을 선택하여 시작하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="stat-value">3</div>
            <div className="stat-label">전체 학생</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">1</div>
            <div className="stat-label">활성 모듈</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">5</div>
            <div className="stat-label">미표시 이벤트</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
