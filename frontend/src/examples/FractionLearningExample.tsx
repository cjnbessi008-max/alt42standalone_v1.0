import React from 'react';
import { StudentLearningContainer } from '../components/StudentLearningContainer';
import './FractionLearningExample.css';

/**
 * 분수 학습 예시 컴포넌트
 *
 * StudentLearningContainer를 사용하여 집중 이탈 감지 및
 * 휴식 가이드가 통합된 학습 환경을 제공합니다.
 */
export const FractionLearningExample: React.FC = () => {
  // 실제 환경에서는 인증된 사용자 정보를 가져옵니다
  const studentId = 'student_demo_001';
  const moduleId = 'fractions_basic';

  return (
    <StudentLearningContainer
      studentId={studentId}
      moduleId={moduleId}
      idleThreshold={30000}      // 30초 비활동 시 집중 이탈로 판단
      breakDuration={15}          // 15초 휴식 가이드
      enableBreakGuide={true}     // 휴식 가이드 활성화
      allowSkipBreak={true}       // 건너뛰기 허용
    >
      <div className="fraction-learning-page">
        {/* 헤더 */}
        <header className="learning-header">
          <h1>분수 배우기 - 기초편</h1>
          <p className="learning-subtitle">
            분수의 개념을 이해하고 간단한 분수 계산을 연습해봅시다
          </p>
        </header>

        {/* 학습 콘텐츠 */}
        <main className="learning-content">
          {/* 개념 설명 */}
          <section className="concept-section">
            <h2>📚 분수란 무엇일까요?</h2>
            <div className="concept-card">
              <p>
                분수는 전체를 똑같은 크기로 나눈 것 중 일부를 나타내는 수입니다.
              </p>
              <div className="fraction-visual">
                <div className="pizza-container">
                  <div className="pizza">
                    <div className="slice slice-1"></div>
                    <div className="slice slice-2"></div>
                    <div className="slice slice-3"></div>
                    <div className="slice slice-4"></div>
                  </div>
                  <p className="visual-description">
                    피자를 4조각으로 나눴을 때, 1조각은 <strong>1/4</strong> 입니다
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 연습 문제 */}
          <section className="practice-section">
            <h2>✏️ 연습 문제</h2>

            <div className="problem-card">
              <h3>문제 1</h3>
              <p>케이크를 8조각으로 나눴습니다. 3조각을 먹었다면 몇 분의 몇을 먹은 것일까요?</p>
              <div className="answer-options">
                <button className="answer-btn">1/8</button>
                <button className="answer-btn answer-correct">3/8</button>
                <button className="answer-btn">3/5</button>
                <button className="answer-btn">5/8</button>
              </div>
            </div>

            <div className="problem-card">
              <h3>문제 2</h3>
              <p>초콜릿 바를 6조각으로 나눴습니다. 2조각을 친구에게 주었다면 몇 분의 몇을 준 것일까요?</p>
              <div className="answer-options">
                <button className="answer-btn answer-correct">2/6</button>
                <button className="answer-btn">1/3</button>
                <button className="answer-btn">4/6</button>
                <button className="answer-btn">2/4</button>
              </div>
              <p className="hint">💡 힌트: 2/6은 1/3과 같은 값이에요!</p>
            </div>

            <div className="problem-card">
              <h3>문제 3</h3>
              <p>물병에 물이 절반 들어있습니다. 이것을 분수로 나타내면?</p>
              <div className="answer-options">
                <button className="answer-btn answer-correct">1/2</button>
                <button className="answer-btn">2/4</button>
                <button className="answer-btn">3/6</button>
                <button className="answer-btn">모두 정답</button>
              </div>
              <p className="hint">💡 힌트: 1/2, 2/4, 3/6은 모두 같은 값이에요!</p>
            </div>
          </section>

          {/* 대화형 연습 */}
          <section className="interactive-section">
            <h2>🎮 대화형 연습</h2>
            <div className="interactive-card">
              <h3>분수 만들기</h3>
              <p>슬라이더를 움직여서 분수를 만들어보세요</p>
              <div className="fraction-builder">
                <div className="fraction-display">
                  <span className="numerator">3</span>
                  <span className="fraction-line"></span>
                  <span className="denominator">8</span>
                </div>
                <div className="sliders">
                  <div className="slider-group">
                    <label>분자 (위의 숫자):</label>
                    <input type="range" min="0" max="8" defaultValue="3" />
                  </div>
                  <div className="slider-group">
                    <label>분모 (아래의 숫자):</label>
                    <input type="range" min="1" max="12" defaultValue="8" />
                  </div>
                </div>
                <div className="visual-feedback">
                  <div className="bars">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`bar ${i < 3 ? 'filled' : ''}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 진행 상황 */}
          <section className="progress-section">
            <h2>📊 학습 진행 상황</h2>
            <div className="progress-card">
              <div className="progress-item">
                <span className="progress-label">완료한 문제</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%' }}></div>
                </div>
                <span className="progress-text">3 / 5 문제</span>
              </div>
              <div className="progress-item">
                <span className="progress-label">정답률</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill success"
                    style={{ width: '80%' }}
                  ></div>
                </div>
                <span className="progress-text">80%</span>
              </div>
            </div>
          </section>
        </main>

        {/* 푸터 */}
        <footer className="learning-footer">
          <button className="btn btn-secondary">이전</button>
          <button className="btn btn-primary">다음</button>
        </footer>
      </div>
    </StudentLearningContainer>
  );
};

export default FractionLearningExample;
