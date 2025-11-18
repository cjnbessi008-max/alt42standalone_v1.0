import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { guestLogin } from '../utils/api';

function LandingPage({ user }) {
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    try {
      await guestLogin();
      window.location.href = '/dashboard';
    } catch (err) {
      alert('게스트 로그인 실패: ' + err.message);
    }
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Geo Spiral</span>
          </h1>
          <p className="hero-subtitle">
            등비수열을 아름다운 나선으로 시각화하여 학습하세요
          </p>
          <p className="hero-description">
            수학의 아름다움을 발견하고, AI 기반 추천으로 맞춤형 학습을 경험하세요
          </p>

          <div className="hero-buttons">
            {user ? (
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                대시보드로 이동
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/register')}>
                  시작하기
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  로그인
                </button>
                <button className="btn btn-ghost" onClick={handleGuestLogin}>
                  게스트로 체험
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="spiral-demo"></div>
        </div>
      </div>

      <div className="features-section">
        <h2>주요 기능</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌀</div>
            <h3>인터랙티브 시각화</h3>
            <p>등비수열, 피보나치, 황금비 등 다양한 나선을 실시간으로 탐구하세요</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI 기반 추천</h3>
            <p>당신의 학습 수준과 진도에 맞는 맞춤형 문제를 추천받으세요</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>가상 스마트폰 UI</h3>
            <p>우측 하단 가상 스마트폰에서 몰입감 있는 학습을 경험하세요</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>학습 분석</h3>
            <p>진도, 점수, 소요 시간을 추적하고 레벨을 올리세요</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>확대/회전/애니메이션</h3>
            <p>직관적인 컨트롤로 나선을 다양한 각도에서 관찰하세요</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>리더보드</h3>
            <p>다른 학습자들과 경쟁하고 순위를 확인하세요</p>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat">
          <h3>15+</h3>
          <p>다양한 수열</p>
        </div>
        <div className="stat">
          <h3>5</h3>
          <p>난이도 레벨</p>
        </div>
        <div className="stat">
          <h3>100%</h3>
          <p>무료</p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2025 Geo Spiral. KAIST Touch Math Academy. All rights reserved.</p>
        <div className="footer-links">
          <a href="/leaderboard">리더보드</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
