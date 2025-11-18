/**
 * Mathematical Expression Evaluator
 * Safely evaluates mathematical expressions using math.js
 */

import { evaluate, compile } from 'mathjs';
import type { Point } from '../types';

export class MathEvaluator {
  /**
   * Evaluate a mathematical expression at a given x value
   */
  static evaluateAt(expression: string, x: number): number {
    try {
      const scope = { x };
      const result = evaluate(expression, scope);

      if (typeof result !== 'number' || !isFinite(result)) {
        return NaN;
      }

      return result;
    } catch (error) {
      console.error(`Error evaluating expression "${expression}" at x=${x}:`, error);
      return NaN;
    }
  }

  /**
   * Generate points for a function over a given range
   */
  static generatePoints(
    expression: string,
    xMin: number,
    xMax: number,
    numPoints: number = 500
  ): Point[] {
    const points: Point[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    try {
      const compiled = compile(expression);

      for (let i = 0; i < numPoints; i++) {
        const x = xMin + i * step;
        try {
          const y = compiled.evaluate({ x });

          if (typeof y === 'number' && isFinite(y)) {
            points.push({ x, y });
          }
        } catch (error) {
          // Skip invalid points
          continue;
        }
      }
    } catch (error) {
      console.error(`Error compiling expression "${expression}":`, error);
    }

    return points;
  }

  /**
   * Validate if an expression is valid
   */
  static isValidExpression(expression: string): boolean {
    try {
      compile(expression);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate the difference between two functions
   */
  static calculateDifference(
    expr1: string,
    expr2: string,
    xMin: number,
    xMax: number,
    numPoints: number = 500
  ): Point[] {
    const points: Point[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    try {
      const compiled1 = compile(expr1);
      const compiled2 = compile(expr2);

      for (let i = 0; i < numPoints; i++) {
        const x = xMin + i * step;
        try {
          const y1 = compiled1.evaluate({ x });
          const y2 = compiled2.evaluate({ x });

          if (typeof y1 === 'number' && typeof y2 === 'number' &&
              isFinite(y1) && isFinite(y2)) {
            points.push({ x, y: Math.abs(y1 - y2) });
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error('Error calculating difference:', error);
    }

    return points;
  }
}
