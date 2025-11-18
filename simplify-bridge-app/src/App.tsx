/**
 * Simplify Bridge - Main Application
 * 복잡한 부등식을 단계적으로 단순화하는 독립형 웹앱
 */

import { useState } from 'react';
import MobileFrame from './components/MobileFrame';
import SimplifyBridge from './components/SimplifyBridge';
import './index.css';

type ViewMode = 'mobile' | 'desktop' | 'moodle';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [moodleData, setMoodleData] = useState({
    problemId: '',
    inequality: '',
  });

  // Moodle에서 데이터를 받아오는 함수 (시뮬레이션)
  const handleMoodleLoad = () => {
    // 실제 환경에서는 Moodle API를 호출
    const mockData = {
      problemId: 'moodle_prob_123',
      inequality: '3x + 7 <= 5x - 3',
    };
    setMoodleData(mockData);
    setViewMode('moodle');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* 상단 컨트롤 바 */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kaist-blue rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Simplify Bridge</h1>
              <p className="text-xs text-gray-500">부등식 단계별 단순화 시스템</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-kaist-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📱 모바일 뷰
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-kaist-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💻 데스크톱 뷰
            </button>
            <button
              onClick={handleMoodleLoad}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'moodle'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              🎓 Moodle 연동 (데모)
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative">
        {viewMode === 'mobile' && (
          <>
            {/* 배경 정보 */}
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Simplify Bridge란?
                </h2>
                <p className="text-gray-600 mb-4">
                  복잡한 부등식을 단순한 비교로 <strong>단계적으로 압축</strong>하여
                  학생들이 각 단계를 명확히 이해할 수 있도록 돕는 교육용 웹앱입니다.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-3xl mb-2">📐</div>
                    <h3 className="font-semibold text-gray-800 mb-1">단계별 학습</h3>
                    <p className="text-sm text-gray-600">
                      각 단계마다 수행된 작업을 명확히 표시
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-3xl mb-2">🎓</div>
                    <h3 className="font-semibold text-gray-800 mb-1">Moodle 연동</h3>
                    <p className="text-sm text-gray-600">
                      LMS와 쉽게 통합하여 문제 자동 로드
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-3xl mb-2">📱</div>
                    <h3 className="font-semibold text-gray-800 mb-1">모바일 최적화</h3>
                    <p className="text-sm text-gray-600">
                      스마트폰 화면에 최적화된 인터페이스
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>💡 사용 방법:</strong> 우측 하단의 가상 스마트폰 화면을 확인해보세요!
                  부등식을 입력하고 단계별로 풀이 과정을 살펴볼 수 있습니다.
                </p>
              </div>
            </div>

            {/* 모바일 프레임 (우측 하단) */}
            <MobileFrame position="bottom-right">
              <SimplifyBridge />
            </MobileFrame>
          </>
        )}

        {viewMode === 'desktop' && (
          <div className="max-w-5xl mx-auto p-8">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <SimplifyBridge />
            </div>
          </div>
        )}

        {viewMode === 'moodle' && (
          <div className="max-w-5xl mx-auto p-8">
            <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                🎓 Moodle 연동 모드
              </h3>
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>문제 ID:</strong> {moodleData.problemId || '없음'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>로드된 부등식:</strong> {moodleData.inequality || '없음'}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                실제 Moodle 환경에서는 API를 통해 자동으로 문제가 로드됩니다.
                (MySQL 5.7, PHP 7.1.9, Moodle 3.7)
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <SimplifyBridge
                initialInequality={moodleData.inequality || '2x + 5 < 3x - 1'}
              />
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer className="mt-16 bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            Simplify Bridge v1.0 | KAIST Touch Math Academy
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Built with React + TypeScript + TailwindCSS + KaTeX
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
