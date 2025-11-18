import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { login } from '../utils/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Geo Spiral</h1>
          <p>로그인하여 학습을 계속하세요</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">사용자명 또는 이메일</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="사용자명 입력"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="비밀번호 입력"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            계정이 없으신가요?{' '}
            <button className="link-button" onClick={() => navigate('/register')}>
              회원가입
            </button>
          </p>
          <p>
            또는{' '}
            <button className="link-button" onClick={() => navigate('/')}>
              홈으로 돌아가기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
