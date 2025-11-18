/**
 * 점근선 애니메이션 커스텀 훅
 * 선을 천천히 그리는 효과
 */

import { useState, useEffect, useRef } from 'react';

export interface AnimationState {
  isAnimating: boolean;
  progress: number; // 0~1
}

export function useAsymptoteAnimation(
  duration: number = 2000,
  autoStart: boolean = false
): [AnimationState, () => void, () => void] {
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0
  });

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /**
   * 애니메이션 시작
   */
  const start = () => {
    setState({ isAnimating: true, progress: 0 });
    startTimeRef.current = performance.now();
    animate();
  };

  /**
   * 애니메이션 리셋
   */
  const reset = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState({ isAnimating: false, progress: 0 });
    startTimeRef.current = null;
  };

  /**
   * 애니메이션 프레임 업데이트
   */
  const animate = () => {
    const currentTime = performance.now();
    const startTime = startTimeRef.current || currentTime;
    const elapsed = currentTime - startTime;

    // 진행도 계산 (0~1)
    let progress = Math.min(elapsed / duration, 1);

    // Easing 함수 적용 (ease-in-out)
    progress = easeInOutCubic(progress);

    setState({
      isAnimating: progress < 1,
      progress
    });

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      startTimeRef.current = null;
    }
  };

  /**
   * 자동 시작
   */
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // 클린업
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoStart]);

  return [state, start, reset];
}

/**
 * Easing 함수: ease-in-out-cubic
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
