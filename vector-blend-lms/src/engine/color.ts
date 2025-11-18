/**
 * Vector Blend LMS - Color Blending Engine
 * Color mixing algorithms based on vector magnitudes
 */

import type { RGB, Vector2D } from '../types/vector';
import { magnitude } from './vector';

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Blend multiple colors based on vector magnitudes
 * Each vector's color is weighted by its magnitude
 */
export function blendVectorColors(vectors: Vector2D[]): RGB {
  if (vectors.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  // Calculate total magnitude for normalization
  const magnitudes = vectors.map(v => magnitude(v));
  const totalMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0);

  if (totalMagnitude === 0) {
    // If all vectors have zero magnitude, return average color
    return averageColors(vectors.map(v => v.color));
  }

  // Weighted sum of colors
  let r = 0, g = 0, b = 0;

  vectors.forEach((v, i) => {
    const weight = magnitudes[i] / totalMagnitude;
    r += v.color.r * weight;
    g += v.color.g * weight;
    b += v.color.b * weight;
  });

  return {
    r: Math.round(clamp(r, 0, 255)),
    g: Math.round(clamp(g, 0, 255)),
    b: Math.round(clamp(b, 0, 255)),
  };
}

/**
 * Blend two colors with a ratio (0 to 1)
 * ratio = 0: 100% colorA, ratio = 1: 100% colorB
 */
export function blendTwoColors(colorA: RGB, colorB: RGB, ratio: number): RGB {
  const t = clamp(ratio, 0, 1);
  return {
    r: Math.round(colorA.r * (1 - t) + colorB.r * t),
    g: Math.round(colorA.g * (1 - t) + colorB.g * t),
    b: Math.round(colorA.b * (1 - t) + colorB.b * t),
  };
}

/**
 * Average multiple colors equally
 */
export function averageColors(colors: RGB[]): RGB {
  if (colors.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  const sum = colors.reduce(
    (acc, c) => ({
      r: acc.r + c.r,
      g: acc.g + c.g,
      b: acc.b + c.b,
    }),
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: Math.round(sum.r / colors.length),
    g: Math.round(sum.g / colors.length),
    b: Math.round(sum.b / colors.length),
  };
}

/**
 * Convert RGB to CSS color string
 */
export function rgbToString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(color: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(clamp(n, 0, 255)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Convert hex string to RGB
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Calculate color difference (Euclidean distance in RGB space)
 */
export function colorDistance(colorA: RGB, colorB: RGB): number {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Check if two colors are approximately equal
 */
export function areColorsEqual(
  colorA: RGB,
  colorB: RGB,
  tolerance: number = 10
): boolean {
  return colorDistance(colorA, colorB) <= tolerance;
}

/**
 * Get luminance of a color (perceived brightness)
 */
export function getLuminance(color: RGB): number {
  // Using relative luminance formula (ITU-R BT.709)
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

/**
 * Determine if color is light or dark (for text contrast)
 */
export function isLightColor(color: RGB): boolean {
  return getLuminance(color) > 128;
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(backgroundColor: RGB): RGB {
  return isLightColor(backgroundColor)
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 };
}

/**
 * Create a set of predefined colors for educational use
 */
export const PRESET_COLORS = {
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
  cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 192, b: 203 },
  lime: { r: 0, g: 255, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  gray: { r: 128, g: 128, b: 128 },
} as const;
