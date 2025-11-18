import { useState, useEffect } from 'react';
import { FlipDirection, Orientation } from './useFlipDetection';

export interface VisualEffectState {
  colorInverted: boolean;
  rotation: number;
  scale: number;
  brightness: number;
  contrast: number;
  hueRotate: number;
  saturate: number;
}

interface UseVisualEffectsOptions {
  enableColorInversion?: boolean;
  enableRotation?: boolean;
  enableScaling?: boolean;
  enableFilterEffects?: boolean;
  transitionDuration?: number;
}

/**
 * Hook to manage visual effects during flip moments
 * Provides inverted/transformed visual states based on orientation changes
 */
export const useVisualEffects = (
  flipDirection: FlipDirection,
  orientation: Orientation,
  isFlipping: boolean,
  options: UseVisualEffectsOptions = {}
) => {
  const {
    enableColorInversion = true,
    enableRotation = true,
    enableScaling = true,
    enableFilterEffects = true,
    transitionDuration = 600,
  } = options;

  const [effects, setEffects] = useState<VisualEffectState>({
    colorInverted: false,
    rotation: 0,
    scale: 1,
    brightness: 100,
    contrast: 100,
    hueRotate: 0,
    saturate: 100,
  });

  useEffect(() => {
    if (!isFlipping) {
      // Reset to normal state when not flipping
      setEffects({
        colorInverted: false,
        rotation: 0,
        scale: 1,
        brightness: 100,
        contrast: 100,
        hueRotate: 0,
        saturate: 100,
      });
      return;
    }

    // Apply flip moment effects
    const newEffects: VisualEffectState = {
      colorInverted: enableColorInversion,
      rotation: enableRotation ? getRotationAngle(flipDirection, orientation) : 0,
      scale: enableScaling ? 1.05 : 1,
      brightness: enableFilterEffects ? 120 : 100,
      contrast: enableFilterEffects ? 110 : 100,
      hueRotate: enableFilterEffects ? getHueRotation(flipDirection) : 0,
      saturate: enableFilterEffects ? 120 : 100,
    };

    setEffects(newEffects);
  }, [
    flipDirection,
    orientation,
    isFlipping,
    enableColorInversion,
    enableRotation,
    enableScaling,
    enableFilterEffects,
  ]);

  // Generate CSS filter string
  const filterStyle = `
    invert(${effects.colorInverted ? '1' : '0'})
    brightness(${effects.brightness}%)
    contrast(${effects.contrast}%)
    hue-rotate(${effects.hueRotate}deg)
    saturate(${effects.saturate}%)
  `.trim();

  // Generate CSS transform string
  const transformStyle = `
    rotate(${effects.rotation}deg)
    scale(${effects.scale})
  `.trim();

  return {
    effects,
    filterStyle,
    transformStyle,
    transitionDuration,
  };
};

/**
 * Calculate rotation angle based on flip direction and orientation
 */
function getRotationAngle(direction: FlipDirection, orientation: Orientation): number {
  if (direction === 'none') return 0;

  // Subtle rotation effect during flip
  if (direction === 'clockwise') {
    return orientation === 'landscape' ? 2 : -2;
  }
  return orientation === 'landscape' ? -2 : 2;
}

/**
 * Calculate hue rotation based on flip direction
 */
function getHueRotation(direction: FlipDirection): number {
  if (direction === 'none') return 0;
  return direction === 'clockwise' ? 15 : -15;
}
