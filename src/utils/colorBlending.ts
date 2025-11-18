/**
 * Parse a hex color to RGB components
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

/**
 * Convert RGB to hex color
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Blend multiple colors with their respective opacities
 * Uses alpha compositing
 */
export const blendColors = (
  colors: Array<{ color: string; opacity: number }>
): string => {
  if (colors.length === 0) return '#ffffff';
  if (colors.length === 1) return colors[0].color;

  // Start with white background
  let r = 255, g = 255, b = 255, a = 1;

  // Apply each color layer from bottom to top
  colors.forEach(({ color, opacity }) => {
    const rgb = hexToRgb(color);
    if (!rgb) return;

    // Alpha compositing formula
    const srcAlpha = opacity;
    const outAlpha = srcAlpha + a * (1 - srcAlpha);

    if (outAlpha > 0) {
      r = (rgb.r * srcAlpha + r * a * (1 - srcAlpha)) / outAlpha;
      g = (rgb.g * srcAlpha + g * a * (1 - srcAlpha)) / outAlpha;
      b = (rgb.b * srcAlpha + b * a * (1 - srcAlpha)) / outAlpha;
      a = outAlpha;
    }
  });

  return rgbToHex(r, g, b);
};

/**
 * Generate a color based on vector properties
 * Useful for automatic color assignment
 */
export const vectorToColor = (x: number, y: number): string => {
  const angle = Math.atan2(y, x);
  const hue = ((angle * 180 / Math.PI) + 360) % 360;
  return hslToHex(hue, 70, 50);
};

/**
 * Convert HSL to hex color
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};
