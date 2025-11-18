/**
 * Unfolding Net Live - 3D Viewer Component
 * Three.js를 사용한 3D 전개도 뷰어
 */

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { PolyhedronGeometry } from './PolyhedronGeometry';
import { useGeometryStore } from '../../store/geometryStore';
import { AnimationState } from '../../types/geometry';
import './UnfoldingNetViewer.css';

export const UnfoldingNetViewer: React.FC = () => {
  const {
    currentProblem,
    animationProgress,
    animationState,
    selectedFaceId,
    selectFace,
    setAnimationProgress,
    animationConfig,
  } = useGeometryStore();

  // 애니메이션 업데이트
  useEffect(() => {
    if (animationState !== AnimationState.UNFOLDING) return;

    const startTime = Date.now();
    const duration = animationConfig.duration / animationConfig.speed;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [animationState, animationConfig, setAnimationProgress]);

  // 문제가 없으면 표시하지 않음
  if (!currentProblem) {
    return (
      <div className="viewer-container viewer-empty">
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  const handleFaceClick = (faceIndex: number) => {
    selectFace(faceIndex.toString());
    console.log('Face clicked:', faceIndex);
  };

  return (
    <div className="viewer-container">
      <Canvas
        shadows
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)' }}
      >
        <Suspense fallback={null}>
          {/* 조명 설정 */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />

          {/* 환경 맵 */}
          <Environment preset="city" />

          {/* 3D 도형 */}
          <PolyhedronGeometry
            type={currentProblem.type}
            unfoldProgress={animationProgress}
            onFaceClick={handleFaceClick}
            selectedFace={selectedFaceId ? parseInt(selectedFaceId) : null}
          />

          {/* 카메라 컨트롤 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2}
          />

          {/* 그리드 헬퍼 */}
          <gridHelper args={[10, 10, '#444444', '#222222']} position={[0, -2, 0]} />
        </Suspense>
      </Canvas>

      {/* 정보 오버레이 */}
      <div className="viewer-overlay">
        <div className="problem-info">
          <h3>{currentProblem.title}</h3>
          <p>{currentProblem.description}</p>
          <span className="difficulty">난이도: {currentProblem.difficulty}</span>
        </div>

        {selectedFaceId && (
          <div className="face-info">
            <p>선택된 면: {selectedFaceId}</p>
          </div>
        )}

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${animationProgress * 100}%` }}
          />
          <span className="progress-text">
            {Math.round(animationProgress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
