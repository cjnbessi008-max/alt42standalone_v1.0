/**
 * useTermNavigation Hook
 * Manages term navigation with keyboard and gesture support
 */

import { useState, useCallback, useEffect } from 'react';
import { Term, SlideDirection } from '@/types';

interface UseTermNavigationProps {
  terms: Term[];
  initialIndex?: number;
  enableKeyboard?: boolean;
  loop?: boolean;
}

interface UseTermNavigationReturn {
  currentIndex: number;
  currentTerm: Term | null;
  direction: SlideDirection;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goNext: () => void;
  goPrevious: () => void;
  goToIndex: (index: number) => void;
  progress: number;
}

export const useTermNavigation = ({
  terms,
  initialIndex = 0,
  enableKeyboard = true,
  loop = false,
}: UseTermNavigationProps): UseTermNavigationReturn => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<SlideDirection>('left');

  const currentTerm = terms[currentIndex] || null;
  const canGoNext = loop ? true : currentIndex < terms.length - 1;
  const canGoPrevious = loop ? true : currentIndex > 0;
  const progress = terms.length > 0 ? ((currentIndex + 1) / terms.length) * 100 : 0;

  const goNext = useCallback(() => {
    if (canGoNext) {
      setDirection('left');
      setCurrentIndex((prev) => {
        if (loop && prev === terms.length - 1) {
          return 0;
        }
        return Math.min(prev + 1, terms.length - 1);
      });
    }
  }, [canGoNext, loop, terms.length]);

  const goPrevious = useCallback(() => {
    if (canGoPrevious) {
      setDirection('right');
      setCurrentIndex((prev) => {
        if (loop && prev === 0) {
          return terms.length - 1;
        }
        return Math.max(prev - 1, 0);
      });
    }
  }, [canGoPrevious, loop, terms.length]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < terms.length) {
        setDirection(index > currentIndex ? 'left' : 'right');
        setCurrentIndex(index);
      }
    },
    [currentIndex, terms.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goPrevious();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          goNext();
          break;
        case 'Home':
          event.preventDefault();
          goToIndex(0);
          break;
        case 'End':
          event.preventDefault();
          goToIndex(terms.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, goNext, goPrevious, goToIndex, terms.length]);

  return {
    currentIndex,
    currentTerm,
    direction,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    goToIndex,
    progress,
  };
};

export default useTermNavigation;
