/**
 * Color utilities for keyword bubbles
 */

export const CATEGORY_COLORS: Record<string, string> = {
  concept: '#4A90E2',      // Blue - 개념
  operation: '#7ED321',    // Green - 연산
  entity: '#F5A623',       // Orange - 개체
  attribute: '#BD10E0',    // Purple - 속성
  default: '#9013FE',      // Default purple
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

export function getColorByImportance(importance: number): string {
  // Gradient from light to dark based on importance (0-1)
  const hue = 220; // Blue hue
  const saturation = 50 + importance * 50; // 50-100%
  const lightness = 70 - importance * 30;   // 70-40%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
