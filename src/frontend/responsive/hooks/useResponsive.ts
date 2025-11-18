/**
 * useResponsive Hook
 * Detect screen size and device type for responsive design
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveState {
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() =>
    getResponsiveState()
  );

  useEffect(() => {
    function handleResize() {
      setState(getResponsiveState());
    }

    function handleOrientationChange() {
      setState(getResponsiveState());
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}

function getResponsiveState(): ResponsiveState {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Determine device type
  let deviceType: DeviceType;
  if (width < BREAKPOINTS.mobile) {
    deviceType = 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  // Determine orientation
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';

  // Check if touch device
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  return {
    deviceType,
    orientation,
    width,
    height,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouchDevice,
  };
}

/**
 * Get optimal canvas size based on device
 */
export function getOptimalCanvasSize(
  deviceType: DeviceType,
  orientation: Orientation,
  containerWidth?: number
): { width: number; height: number } {
  if (deviceType === 'mobile') {
    // For mobile, use almost full width with 4:3 aspect ratio
    const width = containerWidth || window.innerWidth - 40; // 20px padding each side
    const height = orientation === 'portrait' ? width * 1.2 : width * 0.75;
    return { width, height };
  } else if (deviceType === 'tablet') {
    // For tablet, use larger size with 3:2 aspect ratio
    const width = containerWidth || Math.min(window.innerWidth - 80, 700);
    const height = width * 0.75;
    return { width, height };
  } else {
    // For desktop, use fixed optimal size
    const width = containerWidth || 800;
    const height = 600;
    return { width, height };
  }
}
