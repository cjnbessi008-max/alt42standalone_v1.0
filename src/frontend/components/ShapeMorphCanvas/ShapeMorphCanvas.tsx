import React, { useEffect, useRef, useState } from 'react';
import { ShapeMorphEngine } from './ShapeMorphEngine';
import { ConceptShape, TransitionConfig } from '@types/shape.types';
import moodleAPI from '@services/moodle-api';
import './ShapeMorphCanvas.css';

export interface ShapeMorphCanvasProps {
  courseId?: number;
  autoStart?: boolean;
  onConceptChange?: (concept: ConceptShape) => void;
}

export const ShapeMorphCanvas: React.FC<ShapeMorphCanvasProps> = ({
  courseId = 1,
  autoStart = true,
  onConceptChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShapeMorphEngine | null>(null);
  const [currentConcept, setCurrentConcept] = useState<ConceptShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 애니메이션 엔진 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      engineRef.current = new ShapeMorphEngine({
        canvas: canvasRef.current,
        onAnimationComplete: handleAnimationComplete,
        onAnimationStart: handleAnimationStart,
      });

      console.log('[ShapeMorphCanvas] Engine initialized');

      if (autoStart) {
        loadInitialConcept();
      }
    } catch (err) {
      console.error('[ShapeMorphCanvas] Failed to initialize engine:', err);
      setError('애니메이션 엔진 초기화 실패');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // 초기 개념 로드
  const loadInitialConcept = async () => {
    try {
      setIsLoading(true);
      const response = await moodleAPI.getCurrentConcept(courseId);

      if (response.current_concept) {
        setCurrentConcept(response.current_concept);

        if (engineRef.current) {
          engineRef.current.setShape(response.current_concept);
        }

        if (onConceptChange) {
          onConceptChange(response.current_concept);
        }

        console.log('[ShapeMorphCanvas] Loaded initial concept:', response.current_concept.name);
      }
    } catch (err) {
      console.error('[ShapeMorphCanvas] Failed to load initial concept:', err);
      setError('초기 개념 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 새 개념으로 전환
  const transitionToConcept = async (conceptId: number) => {
    if (!engineRef.current) return;

    try {
      const response = await moodleAPI.updateProgress(courseId, conceptId);

      if (response.transition && response.to_concept_id) {
        // 목표 개념 조회
        const concepts = await moodleAPI.getAllConcepts();
        const targetConcept = concepts.find(c => c.id === response.to_concept_id);

        if (targetConcept) {
          console.log('[ShapeMorphCanvas] Transitioning to:', targetConcept.name);

          const transition: TransitionConfig = {
            type: response.transition.type as any,
            duration: response.transition.duration || 2000,
            easing: response.transition.easing as any,
            keyframes: response.transition.keyframes,
          };

          engineRef.current.morphTo(targetConcept, transition);
        }
      }
    } catch (err) {
      console.error('[ShapeMorphCanvas] Failed to transition:', err);
      setError('개념 전환 실패');
    }
  };

  // 애니메이션 시작 핸들러
  const handleAnimationStart = (fromShape: ConceptShape, toShape: ConceptShape) => {
    console.log('[ShapeMorphCanvas] Animation started:', fromShape.name, '→', toShape.name);
  };

  // 애니메이션 완료 핸들러
  const handleAnimationComplete = (shape: ConceptShape) => {
    console.log('[ShapeMorphCanvas] Animation completed:', shape.name);
    setCurrentConcept(shape);

    if (onConceptChange) {
      onConceptChange(shape);
    }

    // Moodle에 완료 이벤트 로그 (백그라운드)
    if (currentConcept) {
      moodleAPI.logAnimationComplete(
        courseId,
        currentConcept.id,
        shape.id,
        2000 // duration
      ).catch(err => console.warn('Failed to log animation:', err));
    }
  };

  // 창 크기 변경 처리
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        engineRef.current.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 외부 API: 프로그래밍 방식으로 전환
  useEffect(() => {
    (window as any).shapeMorphAPI = {
      transitionToConcept,
      getCurrentConcept: () => currentConcept,
      reloadConcept: loadInitialConcept,
    };

    return () => {
      delete (window as any).shapeMorphAPI;
    };
  }, [currentConcept]);

  return (
    <div className="shape-morph-canvas-container">
      <canvas
        ref={canvasRef}
        className="shape-morph-canvas"
        width={300}
        height={400}
      />

      {isLoading && (
        <div className="shape-morph-loading">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="shape-morph-error">
          <p>{error}</p>
          <button onClick={loadInitialConcept}>다시 시도</button>
        </div>
      )}
    </div>
  );
};
