import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [searchParams] = useSearchParams();

  // Handle LTI token from URL
  useEffect(() => {
    const token = searchParams.get('token');
    const context = searchParams.get('context');

    if (token) {
      // Verify token and login
      authAPI.verify()
        .then((response) => {
          if (response.data.success) {
            login(token, response.data.user);
            navigate(response.data.user.role === 'teacher' ? '/dashboard' : '/student');
          }
        })
        .catch(() => {
          setError('Invalid token from LTI');
        });
    }
  }, [searchParams, login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email);

      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate(response.data.user.role === 'teacher' ? '/dashboard' : '/student');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            사고 체력 측정 시스템
          </h1>
          <p className="text-gray-600">
            Mental Stamina Measurement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>또는</p>
          <p className="mt-2">Moodle LMS에서 접속하세요</p>
        </div>
      </div>
    </div>
  );
}
