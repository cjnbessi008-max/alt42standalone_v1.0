/**
 * 터치 제스처 처리 훅
 * 핀치, 스와이프, 탭 지원
 */

import { useRef, useEffect, RefObject } from 'react';

interface TouchGestureHandlers {
  onPinch?: (scale: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
}

export function useTouchGestures(
  elementRef: RefObject<HTMLElement>,
  handlers: TouchGestureHandlers
) {
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    /**
     * 두 터치 포인트 간 거리 계산
     */
    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * 터치 시작
     */
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // 싱글 터치
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        // 핀치 시작
        lastDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      }
    };

    /**
     * 터치 이동
     */
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 기본 스크롤 방지

      if (e.touches.length === 1 && lastTouchRef.current) {
        // 팬 (드래그)
        const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
        const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

        if (handlers.onPan) {
          handlers.onPan(deltaX, deltaY);
        }

        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2 && lastDistanceRef.current) {
        // 핀치 줌
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / lastDistanceRef.current;

        if (handlers.onPinch) {
          handlers.onPinch(scale);
        }

        lastDistanceRef.current = currentDistance;
      }
    };

    /**
     * 터치 종료
     */
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && lastTouchRef.current) {
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - lastTouchRef.current.x);
        const deltaY = Math.abs(touch.clientY - lastTouchRef.current.y);

        // 이동이 거의 없으면 탭으로 간주
        if (deltaX < 10 && deltaY < 10) {
          const now = Date.now();
          const timeSinceLastTap = now - lastTapTimeRef.current;

          if (timeSinceLastTap < 300 && handlers.onDoubleTap) {
            // 더블 탭
            handlers.onDoubleTap(touch.clientX, touch.clientY);
            lastTapTimeRef.current = 0; // 리셋
          } else if (handlers.onTap) {
            // 싱글 탭
            handlers.onTap(touch.clientX, touch.clientY);
            lastTapTimeRef.current = now;
          }
        }
      }

      lastTouchRef.current = null;
      lastDistanceRef.current = null;
    };

    // 이벤트 리스너 등록
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 클린업
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers]);
}
