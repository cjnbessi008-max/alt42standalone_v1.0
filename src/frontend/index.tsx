/**
 * Shape Morph Animation - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { SmartphoneFrame } from './components/SmartphoneFrame/SmartphoneFrame';
import './styles/global.css';

/**
 * Shape Morph 앱 초기화
 */
function initShapeMorphApp() {
  console.log('[Shape Morph] Initializing...');

  // DOM 준비 확인
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
}

/**
 * React 앱 렌더링
 */
function render() {
  // 컨테이너 생성 또는 확인
  let container = document.getElementById('shape-morph-root');

  if (!container) {
    container = document.createElement('div');
    container.id = 'shape-morph-root';
    document.body.appendChild(container);
    console.log('[Shape Morph] Container created');
  }

  // 설정 읽기 (data attributes)
  const position = (container.dataset.position as any) || 'bottom-right';
  const size = (container.dataset.size as any) || 'medium';
  const theme = (container.dataset.theme as any) || 'light';
  const courseId = parseInt(container.dataset.courseId || '1', 10);

  console.log('[Shape Morph] Configuration:', {
    position,
    size,
    theme,
    courseId,
  });

  // React 앱 렌더링
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <SmartphoneFrame
        position={position}
        size={size}
        theme={theme}
        courseId={courseId}
      />
    </React.StrictMode>
  );

  console.log('[Shape Morph] Initialized successfully!');
}

// 자동 초기화
initShapeMorphApp();

// 글로벌 API 노출
(window as any).ShapeMorph = {
  version: '1.0.0',
  init: initShapeMorphApp,
  reload: () => {
    console.log('[Shape Morph] Reloading...');
    initShapeMorphApp();
  },
};

console.log('[Shape Morph] Version 1.0.0 loaded');
