// Validation utilities

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate number is positive
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validate ratio answer (check if within acceptable tolerance)
 */
export const isRatioCorrect = (
  userRatio: number,
  correctRatio: number,
  tolerance: number = 0.05
): boolean => {
  return Math.abs(userRatio - correctRatio) <= tolerance;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate coordinate is within canvas bounds
 */
export const isValidCoordinate = (
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): boolean => {
  return x >= 0 && x <= maxWidth && y >= 0 && y <= maxHeight;
};
