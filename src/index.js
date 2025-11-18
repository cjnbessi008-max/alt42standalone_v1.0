import React from 'react';
import ReactDOM from 'react-dom/client';
import TransformScene from './components/TransformScene/TransformScene';
import './index.css';

/**
 * Transform Scene Application Entry Point
 * Moodle LMS 연동 수학 함수 변환 학습 앱
 */

// 설정 로드
const config = {
  moodleApiUrl: process.env.REACT_APP_MOODLE_API_URL || 'http://localhost/moodle/api',
  problemId: parseInt(new URLSearchParams(window.location.search).get('problem_id') || '1'),
  studentId: parseInt(new URLSearchParams(window.location.search).get('student_id') || '0'),
  courseId: parseInt(new URLSearchParams(window.location.search).get('course_id') || '0'),
  debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
};

// 디버그 정보 출력
if (config.debugMode) {
  console.log('Transform Scene Configuration:', config);
}

// 앱 렌더링
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TransformScene
      problemId={config.problemId}
      moodleApiUrl={config.moodleApiUrl}
      studentId={config.studentId}
      courseId={config.courseId}
    />
  </React.StrictMode>
);

// 성능 모니터링 (선택사항)
if (config.debugMode) {
  const reportWebVitals = (metric) => {
    console.log('Web Vitals:', metric);
  };

  if (typeof window !== 'undefined' && window.performance) {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page Load Time: ${pageLoadTime}ms`);
    });
  }

  // Web Vitals 리포팅 (선택사항)
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }).catch(() => {
    console.log('Web Vitals not available');
  });
}
