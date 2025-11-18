import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 집중 이탈 감지 옵션
 */
export interface FocusDetectionOptions {
  /** 집중 이탈로 판단할 비활동 시간 (밀리초) */
  idleThreshold?: number;
  /** 페이지 가시성 변경 추적 활성화 */
  trackVisibility?: boolean;
  /** 마우스/키보드 활동 추적 활성화 */
  trackActivity?: boolean;
  /** 집중 이탈 감지 시 콜백 */
  onFocusLost?: () => void;
  /** 집중 복귀 시 콜백 */
  onFocusRegained?: () => void;
  /** 비활동 감지 시 콜백 */
  onIdleDetected?: (idleTime: number) => void;
}

/**
 * 집중 이탈 감지 상태
 */
export interface FocusDetectionState {
  /** 현재 페이지가 보이는지 여부 */
  isVisible: boolean;
  /** 현재 사용자가 활동 중인지 여부 */
  isActive: boolean;
  /** 마지막 활동 시간 */
  lastActivityTime: number;
  /** 비활동 시간 (밀리초) */
  idleTime: number;
  /** 집중 이탈 상태인지 여부 */
  isFocusLost: boolean;
}

/**
 * 집중 이탈 감지 훅
 *
 * Page Visibility API, 마우스/키보드 활동을 추적하여
 * 학생의 집중 이탈을 감지합니다.
 *
 * @example
 * ```tsx
 * const { isFocusLost, idleTime } = useFocusDetection({
 *   idleThreshold: 30000, // 30초
 *   onIdleDetected: (time) => {
 *     console.log('Idle detected:', time);
 *   }
 * });
 * ```
 */
export const useFocusDetection = (
  options: FocusDetectionOptions = {}
): FocusDetectionState => {
  const {
    idleThreshold = 30000, // 기본 30초
    trackVisibility = true,
    trackActivity = true,
    onFocusLost,
    onFocusRegained,
    onIdleDetected,
  } = options;

  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [idleTime, setIdleTime] = useState(0);
  const [isFocusLost, setIsFocusLost] = useState(false);

  const focusLostRef = useRef(false);
  const idleCallbackFiredRef = useRef(false);

  // 활동 추적
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIdleTime(0);
    idleCallbackFiredRef.current = false;

    if (focusLostRef.current && isVisible) {
      setIsFocusLost(false);
      focusLostRef.current = false;
      onFocusRegained?.();
    }
  }, [isVisible, onFocusRegained]);

  // Page Visibility API 추적
  useEffect(() => {
    if (!trackVisibility) return;

    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (!visible && !focusLostRef.current) {
        setIsFocusLost(true);
        focusLostRef.current = true;
        onFocusLost?.();
      } else if (visible && focusLostRef.current) {
        // 페이지가 다시 보이면 활동 시간 갱신
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackVisibility, onFocusLost, updateActivity]);

  // 마우스/키보드 활동 추적
  useEffect(() => {
    if (!trackActivity) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [trackActivity, updateActivity]);

  // 비활동 시간 체크
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentIdleTime = now - lastActivityTime;
      setIdleTime(currentIdleTime);

      if (
        currentIdleTime > idleThreshold &&
        isVisible &&
        !focusLostRef.current
      ) {
        setIsFocusLost(true);
        focusLostRef.current = true;
        onFocusLost?.();

        if (!idleCallbackFiredRef.current) {
          onIdleDetected?.(currentIdleTime);
          idleCallbackFiredRef.current = true;
        }
      }
    }, 1000); // 1초마다 체크

    return () => clearInterval(interval);
  }, [lastActivityTime, idleThreshold, isVisible, onFocusLost, onIdleDetected]);

  return {
    isVisible,
    isActive: idleTime < idleThreshold,
    lastActivityTime,
    idleTime,
    isFocusLost,
  };
};
