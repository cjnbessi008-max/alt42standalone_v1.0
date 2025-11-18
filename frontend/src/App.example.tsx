/**
 * Example App.tsx showing how to use the Mind Wandering Detection system
 *
 * This is a reference implementation showing how to integrate
 * behavior tracking into your educational module
 */
import React from 'react';
import { BehaviorTrackingProvider } from './components/BehaviorTrackingProvider';

// Example educational module component
const FractionsModule: React.FC = () => {
  return (
    <div className="module-container">
      <h1>분수 학습 모듈</h1>
      <p>이 모듈에서 분수를 배워봅시다!</p>

      {/* Your educational content here */}
      <div className="learning-content">
        <div className="problem">
          <h2>문제 1: 분수의 덧셈</h2>
          <p>1/4 + 1/4 = ?</p>

          <input type="text" placeholder="정답을 입력하세요" />
          <button>제출</button>
        </div>
      </div>
    </div>
  );
};

// Main App with Behavior Tracking
const App: React.FC = () => {
  // These values would typically come from your auth/routing system
  const studentId = 'student-uuid-here';
  const moduleId = 'fractions-module-uuid';
  const apiUrl = 'http://localhost:8000/api/v1';

  return (
    <BehaviorTrackingProvider
      studentId={studentId}
      moduleId={moduleId}
      apiUrl={apiUrl}
      enableAlerts={true}
    >
      <FractionsModule />
    </BehaviorTrackingProvider>
  );
};

export default App;
