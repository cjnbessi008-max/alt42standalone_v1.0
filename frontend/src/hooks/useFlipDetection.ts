import { useState, useEffect, useCallback } from 'react';

export type Orientation = 'portrait' | 'landscape';
export type FlipDirection = 'none' | 'clockwise' | 'counterclockwise';

interface FlipDetectionState {
  orientation: Orientation;
  previousOrientation: Orientation;
  flipDirection: FlipDirection;
  isFlipping: boolean;
  flipCount: number;
}

interface UseFlipDetectionOptions {
  onFlip?: (direction: FlipDirection, orientation: Orientation) => void;
  debounceMs?: number;
}

/**
 * Custom hook to detect device orientation changes and flip moments
 * Returns current orientation state and flip detection data
 */
export const useFlipDetection = (options: UseFlipDetectionOptions = {}) => {
  const { onFlip, debounceMs = 300 } = options;

  const [state, setState] = useState<FlipDetectionState>(() => {
    const initialOrientation = getOrientation();
    return {
      orientation: initialOrientation,
      previousOrientation: initialOrientation,
      flipDirection: 'none',
      isFlipping: false,
      flipCount: 0,
    };
  });

  const [flipTimeout, setFlipTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleOrientationChange = useCallback(() => {
    const newOrientation = getOrientation();

    setState(prev => {
      if (prev.orientation === newOrientation) {
        return prev;
      }

      const direction = determineFlipDirection(prev.orientation, newOrientation);

      // Trigger callback if provided
      if (onFlip) {
        onFlip(direction, newOrientation);
      }

      return {
        orientation: newOrientation,
        previousOrientation: prev.orientation,
        flipDirection: direction,
        isFlipping: true,
        flipCount: prev.flipCount + 1,
      };
    });

    // Clear previous timeout
    if (flipTimeout) {
      clearTimeout(flipTimeout);
    }

    // Set new timeout to reset flipping state
    const timeout = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isFlipping: false,
        flipDirection: 'none',
      }));
    }, debounceMs);

    setFlipTimeout(timeout);
  }, [onFlip, debounceMs, flipTimeout]);

  useEffect(() => {
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (flipTimeout) {
        clearTimeout(flipTimeout);
      }
    };
  }, [handleOrientationChange, flipTimeout]);

  return state;
};

/**
 * Get current device orientation
 */
function getOrientation(): Orientation {
  if (window.matchMedia('(orientation: portrait)').matches) {
    return 'portrait';
  }
  return 'landscape';
}

/**
 * Determine flip direction based on orientation change
 */
function determineFlipDirection(
  from: Orientation,
  to: Orientation
): FlipDirection {
  if (from === to) return 'none';

  // Simple heuristic: portrait -> landscape = clockwise
  // landscape -> portrait = counterclockwise
  if (from === 'portrait' && to === 'landscape') {
    return 'clockwise';
  }
  return 'counterclockwise';
}
