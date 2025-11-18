import { useState, useEffect, useRef } from 'react';

interface UseFrequencyAnimationProps {
  targetValue: number;
  maxValue: number;
  duration?: number;  // ms
  delay?: number;     // ms
  easing?: (t: number) => number;
}

/**
 * 도수분포 막대 애니메이션 훅
 * 부드러운 차오름 효과를 위한 easing 함수 사용
 */
export const useFrequencyAnimation = ({
  targetValue,
  maxValue,
  duration = 1000,
  delay = 0,
  easing = easeOutCubic,
}: UseFrequencyAnimationProps) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // 지연 후 애니메이션 시작
    const delayTimeout = setTimeout(() => {
      setIsAnimating(true);
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const newValue = easedProgress * targetValue;
        setCurrentValue(newValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, delay, easing]);

  const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;

  return {
    currentValue,
    percentage,
    isAnimating,
  };
};

/**
 * Easing 함수들
 */

// 부드러운 감속 (추천)
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

// 부드러운 가속 후 감속
export const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// 탄성 효과
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// 바운스 효과
export const easeOutBounce = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};
