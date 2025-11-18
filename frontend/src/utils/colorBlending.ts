/**
 * Color Blending Utilities
 * Implements various blend modes for visualizing function differences
 */

import type { BlendMode } from '../types';

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export class ColorBlender {
  /**
   * Parse hex color to RGB
   */
  static hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 1
        }
      : { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Convert RGB to hex string
   */
  static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Clamp value between 0 and 255
   */
  static clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
  }

  /**
   * Blend two colors using the specified blend mode
   */
  static blend(color1: RGB, color2: RGB, mode: BlendMode, alpha: number = 1): RGB {
    const blend = { r: 0, g: 0, b: 0, a: 1 };

    switch (mode) {
      case 'difference':
        blend.r = Math.abs(color1.r - color2.r);
        blend.g = Math.abs(color1.g - color2.g);
        blend.b = Math.abs(color1.b - color2.b);
        break;

      case 'multiply':
        blend.r = (color1.r * color2.r) / 255;
        blend.g = (color1.g * color2.g) / 255;
        blend.b = (color1.b * color2.b) / 255;
        break;

      case 'screen':
        blend.r = 255 - ((255 - color1.r) * (255 - color2.r)) / 255;
        blend.g = 255 - ((255 - color1.g) * (255 - color2.g)) / 255;
        blend.b = 255 - ((255 - color1.b) * (255 - color2.b)) / 255;
        break;

      case 'overlay':
        blend.r = this.overlayChannel(color1.r, color2.r);
        blend.g = this.overlayChannel(color1.g, color2.g);
        blend.b = this.overlayChannel(color1.b, color2.b);
        break;

      case 'add':
        blend.r = this.clamp(color1.r + color2.r);
        blend.g = this.clamp(color1.g + color2.g);
        blend.b = this.clamp(color1.b + color2.b);
        break;

      case 'subtract':
        blend.r = this.clamp(color1.r - color2.r);
        blend.g = this.clamp(color1.g - color2.g);
        blend.b = this.clamp(color1.b - color2.b);
        break;
    }

    // Apply alpha blending
    blend.r = this.clamp(blend.r * alpha + color1.r * (1 - alpha));
    blend.g = this.clamp(blend.g * alpha + color1.g * (1 - alpha));
    blend.b = this.clamp(blend.b * alpha + color1.b * (1 - alpha));

    return blend;
  }

  /**
   * Overlay blend mode for a single channel
   */
  private static overlayChannel(base: number, blend: number): number {
    if (base < 128) {
      return (2 * base * blend) / 255;
    } else {
      return 255 - (2 * (255 - base) * (255 - blend)) / 255;
    }
  }

  /**
   * Interpolate between two colors
   */
  static interpolate(color1: RGB, color2: RGB, t: number): RGB {
    return {
      r: this.clamp(color1.r + (color2.r - color1.r) * t),
      g: this.clamp(color1.g + (color2.g - color1.g) * t),
      b: this.clamp(color1.b + (color2.b - color1.b) * t),
      a: 1
    };
  }

  /**
   * Generate a gradient color based on intensity (0-1)
   */
  static gradientColor(intensity: number, startColor: string, endColor: string): string {
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);
    const interpolated = this.interpolate(start, end, intensity);
    return this.rgbToHex(interpolated);
  }
}
