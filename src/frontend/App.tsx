/**
 * Main App Component
 * Interactive Vector Drag Application with real-time graph updates
 */

import React, { useState } from 'react';
import { VectorCanvas } from './components/canvas/VectorCanvas';
import { SmartphoneFrame } from './responsive/components/SmartphoneFrame';
import { useVectorTransform } from './hooks/useVectorTransform';
import { useResponsive, getOptimalCanvasSize } from './responsive/hooks/useResponsive';
import { VectorComponent, VectorGraphState, Vector2D } from './types/vector.types';
import './responsive/styles/mobile.css';

// Initial vectors
const initialVectors: VectorComponent[] = [
  {
    id: 'v1',
    value: { x: 3, y: 4 },
    color: '#ff6b6b',
    label: 'A',
    isSelected: false,
  },
  {
    id: 'v2',
    value: { x: -2, y: 3 },
    color: '#4ecdc4',
    label: 'B',
    isSelected: false,
  },
  {
    id: 'v3',
    value: { x: 4, y: -2 },
    color: '#45b7d1',
    label: 'C',
    isSelected: false,
  },
];

function App() {
  const responsive = useResponsive();
  const canvasSize = getOptimalCanvasSize(responsive.deviceType, responsive.orientation);

  // Graph state
  const [graphState] = useState<VectorGraphState>({
    origin: { x: canvasSize.width / 2, y: canvasSize.height / 2 },
    scale: 30,
    gridSize: 1,
    showGrid: true,
    showAxes: true,
    axisRange: {
      xMin: -10,
      xMax: 10,
      yMin: -10,
      yMax: 10,
    },
  });

  const {
    vectors,
    updateVector,
    addVector,
    resetVectors,
    getResultant,
    setVectorSelected,
  } = useVectorTransform(initialVectors);

  const [showResultant, setShowResultant] = useState(true);
  const [showSmartphone, setShowSmartphone] = useState(responsive.isDesktop);

  const handleVectorChange = (id: string, newValue: Vector2D) => {
    updateVector(id, newValue);
  };

  const handleVectorSelect = (id: string) => {
    // Deselect all others, select this one
    vectors.forEach((v) => {
      setVectorSelected(v.id, v.id === id);
    });
  };

  const handleAddVector = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomX = Math.random() * 8 - 4;
    const randomY = Math.random() * 8 - 4;

    addVector({
      id: `v${Date.now()}`,
      value: { x: randomX, y: randomY },
      color: randomColor,
      label: String.fromCharCode(65 + vectors.length),
      isSelected: false,
    });
  };

  const resultant = getResultant();
  const resultantMagnitude = Math.sqrt(resultant.x ** 2 + resultant.y ** 2);

  // Main content component
  const MainContent = () => (
    <div style={{ padding: responsive.isMobile ? '10px' : '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>
        벡터 성분 드래그 (Component Drag)
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        벡터를 드래그하면 그래프가 실시간으로 변화합니다
      </p>

      {/* Controls */}
      <div
        className={responsive.isMobile ? 'mobile-controls' : ''}
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button className="mobile-button" onClick={handleAddVector}>
          + 벡터 추가
        </button>
        <button className="mobile-button" onClick={resetVectors}>
          🔄 초기화
        </button>
        <button
          className="mobile-button"
          onClick={() => setShowResultant(!showResultant)}
          style={{ background: showResultant ? '#28a745' : '#6c757d' }}
        >
          {showResultant ? '합성벡터 숨김' : '합성벡터 표시'}
        </button>
        {responsive.isDesktop && (
          <button
            className="mobile-button"
            onClick={() => setShowSmartphone(!showSmartphone)}
            style={{ background: '#6c5ce7' }}
          >
            {showSmartphone ? '📱 스마트폰 숨김' : '📱 스마트폰 표시'}
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        className={responsive.isMobile ? 'canvas-container-mobile' : ''}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}
      >
        <VectorCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          graphState={graphState}
          vectors={vectors}
          onVectorChange={handleVectorChange}
          onVectorSelect={handleVectorSelect}
          showResultant={showResultant}
        />
      </div>

      {/* Vector Information Panel */}
      <div
        className={responsive.isMobile ? 'mobile-vector-info' : ''}
        style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '15px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>벡터 정보</h3>

        {vectors.map((v) => (
          <div
            key={v.id}
            className={responsive.isMobile ? 'mobile-vector-info-row' : ''}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <span style={{ fontWeight: 'bold', color: v.color }}>
              벡터 {v.label}:
            </span>
            <span>
              ({v.value.x.toFixed(2)}, {v.value.y.toFixed(2)}) | 크기:{' '}
              {Math.sqrt(v.value.x ** 2 + v.value.y ** 2).toFixed(2)}
            </span>
          </div>
        ))}

        {showResultant && (
          <div
            className={responsive.isMobile ? 'mobile-vector-info-row' : ''}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              marginTop: '10px',
              borderTop: '2px solid #ff00ff',
              fontWeight: 'bold',
            }}
          >
            <span style={{ color: '#ff00ff' }}>합성벡터 (R):</span>
            <span>
              ({resultant.x.toFixed(2)}, {resultant.y.toFixed(2)}) | 크기:{' '}
              {resultantMagnitude.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          maxWidth: '800px',
          margin: '20px auto',
          padding: '15px',
          background: '#e7f3ff',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>사용 방법:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>벡터 끝의 원을 드래그하여 벡터를 이동시키세요</li>
          <li>실시간으로 그래프와 합성벡터가 업데이트됩니다</li>
          <li>모바일과 태블릿에서 터치로 조작 가능합니다</li>
          <li>데스크톱에서는 우측 하단에 스마트폰 시뮬레이터가 표시됩니다</li>
        </ul>
      </div>

      {/* Technology Stack Info */}
      <div
        style={{
          maxWidth: '800px',
          margin: '20px auto',
          padding: '15px',
          background: '#f0f0f0',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>기술 스택:</strong> React 18 + TypeScript | SVG 렌더링 | 터치/마우스 드래그 지원
        </p>
        <p style={{ margin: '5px 0 0 0' }}>
          <strong>LMS 연동:</strong> Moodle 3.7 호환 (PHP 7.1.9, MySQL 5.7)
        </p>
      </div>
    </div>
  );

  return (
    <div className="no-select">
      <MainContent />

      {/* Smartphone Frame (Desktop only) */}
      {responsive.isDesktop && showSmartphone && (
        <SmartphoneFrame position="bottom-right" width={375} height={600}>
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
            <MainContent />
          </div>
        </SmartphoneFrame>
      )}
    </div>
  );
}

export default App;
