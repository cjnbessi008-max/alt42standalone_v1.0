/**
 * 워밍업 문제 추천 시스템 - 메인 앱
 */
import React from 'react';
import WarmupProblemRecommender from './components/WarmupProblemRecommender';
import './App.css';

function App() {
  // 실제 환경에서는 로그인된 학생 ID를 가져와야 함
  // 여기서는 예시로 하드코딩
  const studentId = "student_123";

  // 현재 문제 ID (선택사항)
  // LMS에서 현재 풀고 있는 문제 ID를 전달할 수 있음
  const currentProblemId = undefined; // 또는 LMS에서 가져온 ID

  return (
    <div className="App">
      <WarmupProblemRecommender
        studentId={studentId}
        currentProblemId={currentProblemId}
      />
    </div>
  );
}

export default App;
