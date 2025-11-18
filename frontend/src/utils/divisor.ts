/**
 * Utility functions for divisor calculations
 */

/**
 * Find all divisors of a number
 * @param num - The number to find divisors for
 * @returns Array of divisors in ascending order
 */
export function findDivisors(num: number): number[] {
  if (num <= 0 || !Number.isInteger(num)) {
    return [];
  }

  const divisors: number[] = [];
  const sqrt = Math.sqrt(num);

  for (let i = 1; i <= sqrt; i++) {
    if (num % i === 0) {
      divisors.push(i);
      if (i !== num / i) {
        divisors.push(num / i);
      }
    }
  }

  return divisors.sort((a, b) => a - b);
}

/**
 * Check if a number is a divisor of another number
 * @param divisor - The potential divisor
 * @param number - The number to check
 * @returns True if divisor divides number evenly
 */
export function isDivisor(divisor: number, number: number): boolean {
  if (divisor === 0 || number === 0) return false;
  return number % divisor === 0;
}

/**
 * Find common divisors of two numbers
 * @param num1 - First number
 * @param num2 - Second number
 * @returns Array of common divisors
 */
export function findCommonDivisors(num1: number, num2: number): number[] {
  const divisors1 = findDivisors(num1);
  const divisors2 = findDivisors(num2);

  return divisors1.filter(d => divisors2.includes(d));
}

/**
 * Find the greatest common divisor (GCD) of two numbers
 * @param a - First number
 * @param b - Second number
 * @returns The GCD
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }

  return a;
}

/**
 * Generate a random number with a specific number of divisors (for problem generation)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param targetDivisorCount - Desired number of divisors (approximate)
 * @returns A number with approximately the target divisor count
 */
export function generateNumberWithDivisors(
  min: number,
  max: number,
  targetDivisorCount?: number
): number {
  if (!targetDivisorCount) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Try multiple candidates and pick the one closest to target
  let bestNum = min;
  let bestDiff = Infinity;

  for (let i = 0; i < 20; i++) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    const divisorCount = findDivisors(candidate).length;
    const diff = Math.abs(divisorCount - targetDivisorCount);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestNum = candidate;
    }

    if (diff === 0) break;
  }

  return bestNum;
}

/**
 * Get color for a molecule based on its number
 * @param num - The number
 * @returns Hex color string
 */
export function getColorForNumber(num: number): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52B788', // Green
  ];

  return colors[num % colors.length];
}

/**
 * Calculate difficulty based on number range and divisor count
 * @param num - The number
 * @returns Difficulty level
 */
export function calculateDifficulty(num: number): 'easy' | 'medium' | 'hard' {
  const divisorCount = findDivisors(num).length;

  if (num <= 20 && divisorCount <= 4) return 'easy';
  if (num <= 50 && divisorCount <= 6) return 'medium';
  return 'hard';
}
