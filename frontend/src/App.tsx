import React, { useState } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import VectorSpaceMap from './components/VectorSpaceMap/VectorSpaceMap';
import type { Concept } from './types';
import './App.css';

/**
 * 메인 애플리케이션 컴포넌트
 * Moodle LMS와 연동하여 Vector Space Map을 우측 하단 스마트폰 화면에 표시
 */
function App() {
  const [moduleId, setModuleId] = useState<string>('demo-module-1');
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [showStudentView, setShowStudentView] = useState(false);

  const handleConceptSelect = (concept: Concept) => {
    console.log('Selected concept:', concept);
    // 여기서 개념 선택 시 추가 동작 구현 가능
  };

  return (
    <div className="app">
      {/* 메인 컨텐츠 영역 */}
      <div className="main-content">
        <header className="app-header">
          <h1>AI Education System - Vector Space Map</h1>
          <p>Moodle LMS 연동 학습 개념 시각화 시스템</p>
        </header>

        <div className="controls-panel">
          <div className="control-group">
            <label htmlFor="module-select">Module:</label>
            <select
              id="module-select"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              <option value="demo-module-1">분수의 이해 (Demo)</option>
              <option value="demo-module-2">기하학 기초 (Demo)</option>
              <option value="demo-module-3">대수학 입문 (Demo)</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showStudentView}
                onChange={(e) => {
                  setShowStudentView(e.target.checked);
                  setStudentId(e.target.checked ? 'student-001' : undefined);
                }}
              />
              학생 학습 경로 표시
            </label>
          </div>
        </div>

        <div className="info-panel">
          <h2>Vector Space Map이란?</h2>
          <p>
            Vector Space Map은 AI가 분석한 학습 개념들을 벡터 공간에 시각화하여,
            개념 간의 관계와 학습 경로를 직관적으로 보여주는 도구입니다.
          </p>
          <ul>
            <li><strong>노드 크기:</strong> 개념의 난이도를 나타냅니다</li>
            <li><strong>노드 색상:</strong> 개념의 카테고리를 나타냅니다</li>
            <li><strong>연결선:</strong> 개념 간의 관계를 나타냅니다</li>
            <li><strong>클릭:</strong> 개념을 클릭하면 상세 정보를 볼 수 있습니다</li>
            <li><strong>드래그:</strong> 노드를 드래그하여 위치를 조정할 수 있습니다</li>
            <li><strong>줌/팬:</strong> 마우스 휠과 드래그로 확대/이동할 수 있습니다</li>
          </ul>

          <h3>Moodle LMS 연동</h3>
          <p>
            이 시스템은 Moodle 3.7 (PHP 7.1.9, MySQL 5.7)과 연동하여
            퀴즈 문제 정보를 자동으로 분석하고 개념 맵을 생성합니다.
          </p>
        </div>
      </div>

      {/* 우측 하단 스마트폰 화면 */}
      <SmartphoneFrame position="bottom-right" size="medium">
        <div className="smartphone-app">
          <div className="smartphone-app-header">
            <h3>개념 지도</h3>
            <span className="module-name">{moduleId}</span>
          </div>

          <VectorSpaceMap
            moduleId={moduleId}
            interactiveMode="explore"
            dimension="2d"
            colorScheme="by-category"
            onConceptSelect={handleConceptSelect}
            studentId={studentId}
            className="smartphone-vector-map"
          />
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
