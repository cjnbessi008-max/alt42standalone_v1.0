import { useState } from 'react';
import { authAPI } from '../../services/api';
import type { User } from '../../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gradeLevel: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (isRegister) {
        if (mode === 'student') {
          response = await authAPI.studentRegister(
            formData.name,
            formData.email,
            formData.password,
            formData.gradeLevel
          );
        } else {
          response = await authAPI.teacherRegister(formData.name, formData.email, formData.password);
        }
      } else {
        if (mode === 'student') {
          response = await authAPI.studentLogin(formData.email, formData.password);
        } else {
          response = await authAPI.teacherLogin(formData.email, formData.password);
        }
      }

      onLogin({ ...response.user, type: mode }, response.token);
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            과도한 고민 감지 LMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegister ? '계정 만들기' : '로그인'}
          </p>
        </div>

        <div className="flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setMode('student')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg border ${
              mode === 'student'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            학생
          </button>
          <button
            type="button"
            onClick={() => setMode('teacher')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border ${
              mode === 'teacher'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            교사
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {isRegister && mode === 'student' && (
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
                  학년 (선택사항)
                </label>
                <input
                  id="gradeLevel"
                  type="text"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="3학년"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : isRegister ? '가입하기' : '로그인'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
