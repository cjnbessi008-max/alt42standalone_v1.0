/**
 * Unfolding Net Live - Main Application
 * LMS 연동 3D 전개도 학습 앱
 */

import { useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame/SmartphoneFrame';
import { useGeometryStore } from './store/geometryStore';
import { moodleApi } from './services/moodleApi';
import './App.css';

function App() {
  const { setProblem } = useGeometryStore();

  // 초기 문제 로드
  useEffect(() => {
    const loadInitialProblem = async () => {
      try {
        // Moodle에서 문제 정보 가져오기
        // 실제로는 URL 파라미터나 로컬스토리지에서 courseId, moduleId를 가져옴
        const problem = await moodleApi.getProblem({
          courseId: 'course-1',
          moduleId: 'module-1',
          userId: 'user-1',
        });

        setProblem(problem);
      } catch (error) {
        console.error('Failed to load problem:', error);
        // 에러 발생 시 더미 데이터 사용 (개발용)
      }
    };

    loadInitialProblem();
  }, [setProblem]);

  return (
    <div className="app-container">
      {/* 메인 컨텐츠 영역 (LMS 화면 시뮬레이션) */}
      <div className="main-content">
        <header className="app-header">
          <h1>🎓 Touch Math Academy - 3D 기하학</h1>
          <p className="subtitle">입체도형의 전개도를 학습해보세요</p>
        </header>

        <section className="lesson-content">
          <div className="lesson-card">
            <h2>📐 정육면체의 전개도</h2>
            <p>
              정육면체는 6개의 정사각형 면으로 이루어진 입체도형입니다.
              우측 하단의 3D 모델을 통해 정육면체가 어떻게 펼쳐지는지 관찰해보세요.
            </p>

            <div className="lesson-objectives">
              <h3>학습 목표</h3>
              <ul>
                <li>정육면체의 구조 이해하기</li>
                <li>전개도의 개념 파악하기</li>
                <li>입체도형과 평면도형의 관계 학습하기</li>
                <li>공간 지각 능력 향상하기</li>
              </ul>
            </div>

            <div className="instructions">
              <h3>💡 사용 방법</h3>
              <ol>
                <li>우측 하단의 스마트폰 화면에서 3D 모델을 확인하세요</li>
                <li>▶ 재생 버튼을 눌러 전개 애니메이션을 시작하세요</li>
                <li>마우스로 드래그하여 모델을 회전시킬 수 있습니다</li>
                <li>속도 슬라이더로 애니메이션 속도를 조절하세요</li>
                <li>각 면을 클릭하여 선택할 수 있습니다</li>
              </ol>
            </div>

            <div className="quiz-section">
              <h3>❓ 확인 문제</h3>
              <div className="quiz-item">
                <p><strong>Q1.</strong> 정육면체의 전개도는 몇 개의 정사각형으로 이루어져 있나요?</p>
                <div className="quiz-options">
                  <button className="quiz-option">4개</button>
                  <button className="quiz-option">5개</button>
                  <button className="quiz-option correct">6개</button>
                  <button className="quiz-option">8개</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="app-footer">
          <p>© 2024 KAIST Touch Math Academy</p>
          <p className="version">Unfolding Net Live v1.0</p>
        </footer>
      </div>

      {/* 우측 하단 스마트폰 프레임 */}
      <SmartphoneFrame position="bottom-right" minimizable={true} />
    </div>
  );
}

export default App;
