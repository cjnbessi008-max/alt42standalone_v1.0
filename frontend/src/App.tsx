import React from 'react';
import SmartphoneSimulator from './components/SmartphoneSimulator';
import QuantifierFriendsApp from './components/QuantifierFriendsApp';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Main content area (desktop view) */}
      <div className="desktop-content">
        <header className="main-header">
          <h1>🎓 Quantifier Friends</h1>
          <p className="tagline">논리 한정사를 재미있게 배우는 교육 앱</p>
        </header>

        <div className="content-grid">
          <section className="info-card">
            <h2>📱 앱 소개</h2>
            <p>
              <strong>Quantifier Friends</strong>는 논리학의 핵심 개념인 한정사
              (모든, 어떤)를 캐릭터 친구들과 함께 학습하는 교육용 웹 앱입니다.
            </p>
            <ul>
              <li>🦉 <strong>올빼미 박사</strong>: 전칭 한정사 "모든(∀)" 전문가</li>
              <li>🦊 <strong>여우 탐정</strong>: 존재 한정사 "어떤(∃)" 전문가</li>
            </ul>
          </section>

          <section className="info-card">
            <h2>✨ 주요 기능</h2>
            <ul>
              <li>캐릭터 기반 대화형 학습</li>
              <li>즉각적인 피드백과 설명</li>
              <li>힌트 시스템</li>
              <li>학습 진도 추적</li>
              <li>Moodle LMS 연동 지원</li>
            </ul>
          </section>

          <section className="info-card">
            <h2>🎯 학습 목표</h2>
            <p>학생들은 이 앱을 통해:</p>
            <ul>
              <li>전칭 한정사(모든)의 의미와 사용법 이해</li>
              <li>존재 한정사(어떤)의 의미와 사용법 이해</li>
              <li>논리적 사고력 향상</li>
              <li>수학적 명제의 참/거짓 판단 능력 향상</li>
            </ul>
          </section>

          <section className="info-card">
            <h2>🔗 기술 스택</h2>
            <div className="tech-stack">
              <span className="tech-badge">React</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">PostgreSQL</span>
              <span className="tech-badge">Moodle API</span>
            </div>
          </section>
        </div>

        <footer className="main-footer">
          <p>우측 하단의 스마트폰 화면에서 앱을 체험해보세요 →</p>
        </footer>
      </div>

      {/* Smartphone simulator with the actual app */}
      <SmartphoneSimulator position="bottom-right">
        <QuantifierFriendsApp />
      </SmartphoneSimulator>
    </div>
  );
}

export default App;
