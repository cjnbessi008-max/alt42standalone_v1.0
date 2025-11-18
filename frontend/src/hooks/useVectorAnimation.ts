/**
 * Custom Hook for Vector Animation
 * 벡터 애니메이션을 위한 커스텀 훅
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Vector2D, AnimationState, EasingFunction } from '../types/vector';
import { lerp, easing } from '../utils/vectorMath';

interface UseVectorAnimationOptions {
  /** 시작 위치 */
  start: Vector2D;
  /** 끝 위치 */
  end: Vector2D;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 애니메이션 딜레이 (ms) */
  delay?: number;
  /** Easing 함수 */
  easingFunction?: EasingFunction;
  /** 자동 시작 여부 */
  autoPlay?: boolean;
  /** 반복 여부 */
  loop?: boolean;
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void;
}

export function useVectorAnimation({
  start,
  end,
  duration = 1000,
  delay = 0,
  easingFunction = easing.easeOutCubic,
  autoPlay = true,
  loop = false,
  onComplete,
}: UseVectorAnimationOptions) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    progress: 0,
    isPlaying: false,
    currentPosition: start,
    currentRotation: 0,
  });

  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay;
      }

      const elapsed = timestamp - startTimeRef.current;

      if (elapsed < 0) {
        // 딜레이 대기 중
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunction(progress);

      const currentPosition = lerp(start, end, easedProgress);
      const currentRotation = Math.atan2(end.y - start.y, end.x - start.x);

      setAnimationState({
        progress: easedProgress,
        isPlaying: progress < 1,
        currentPosition,
        currentRotation,
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료
        startTimeRef.current = undefined;
        onComplete?.();

        if (loop) {
          // 루프 모드: 다시 시작
          setTimeout(() => {
            startTimeRef.current = undefined;
            animationFrameRef.current = requestAnimationFrame(animate);
          }, 0);
        }
      }
    },
    [start, end, duration, delay, easingFunction, onComplete, loop]
  );

  const play = useCallback(() => {
    if (animationState.isPlaying) return;

    setAnimationState((prev) => ({ ...prev, isPlaying: true }));
    startTimeRef.current = undefined;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate, animationState.isPlaying]);

  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      setAnimationState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = undefined;
    setAnimationState({
      progress: 0,
      isPlaying: false,
      currentPosition: start,
      currentRotation: 0,
    });
  }, [start]);

  const restart = useCallback(() => {
    reset();
    setTimeout(() => play(), 0);
  }, [reset, play]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoPlay, play]);

  return {
    animationState,
    play,
    pause,
    reset,
    restart,
  };
}
