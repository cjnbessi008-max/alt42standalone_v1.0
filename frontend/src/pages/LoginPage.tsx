import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(username, password);
      navigate('/problems');
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LMS 학습 시스템</h1>
            <p className="text-gray-600">문제 읽기·풀이 단계 분리 시스템</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">사용자 이름</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="label">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>데모 계정이 필요하신가요?</p>
            <p className="mt-2">
              <span className="font-semibold">학생:</span> student / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
