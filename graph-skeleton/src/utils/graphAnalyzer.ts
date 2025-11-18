import { MathEngine } from './mathEngine';
import { Point, CriticalPoint, InflectionPoint, Interval, GraphAnalysis } from './types';

export class GraphAnalyzer {
  private engine: MathEngine;
  private domain: { min: number; max: number };
  private resolution: number;

  constructor(expression: string, domain: { min: number; max: number } = { min: -10, max: 10 }, resolution: number = 200) {
    this.engine = new MathEngine(expression);
    this.domain = domain;
    this.resolution = resolution;
  }

  /**
   * Generate graph points
   */
  generatePoints(): Point[] {
    const points: Point[] = [];
    const step = (this.domain.max - this.domain.min) / this.resolution;

    for (let x = this.domain.min; x <= this.domain.max; x += step) {
      const y = this.engine.evaluate(x);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x, y });
      }
    }

    return points;
  }

  /**
   * Find and classify critical points
   */
  findCriticalPoints(): CriticalPoint[] {
    const criticalXValues = this.engine.findCriticalPoints(this.domain);
    const criticalPoints: CriticalPoint[] = [];

    for (const x of criticalXValues) {
      const y = this.engine.evaluate(x);
      const secondDerivative = this.engine.evaluateSecondDerivative(x);

      let type: 'maximum' | 'minimum' | 'saddle';

      if (secondDerivative > 0) {
        type = 'minimum';
      } else if (secondDerivative < 0) {
        type = 'maximum';
      } else {
        type = 'saddle';
      }

      if (!isNaN(y) && isFinite(y)) {
        criticalPoints.push({
          x,
          y,
          type,
          value: y
        });
      }
    }

    return criticalPoints;
  }

  /**
   * Find inflection points
   */
  findInflectionPoints(): InflectionPoint[] {
    const inflectionXValues = this.engine.findInflectionPoints(this.domain);
    const inflectionPoints: InflectionPoint[] = [];

    for (const x of inflectionXValues) {
      const y = this.engine.evaluate(x);

      if (!isNaN(y) && isFinite(y)) {
        inflectionPoints.push({
          x,
          y,
          value: y
        });
      }
    }

    return inflectionPoints;
  }

  /**
   * Determine increasing/decreasing intervals
   */
  findIntervals(): Interval[] {
    const intervals: Interval[] = [];
    const step = (this.domain.max - this.domain.min) / 100;

    let currentType: 'increasing' | 'decreasing' | null = null;
    let intervalStart = this.domain.min;

    for (let x = this.domain.min; x <= this.domain.max; x += step) {
      const derivative = this.engine.evaluateFirstDerivative(x);

      if (isNaN(derivative) || !isFinite(derivative)) continue;

      const newType: 'increasing' | 'decreasing' = derivative > 0 ? 'increasing' : 'decreasing';

      if (currentType === null) {
        currentType = newType;
        intervalStart = x;
      } else if (currentType !== newType) {
        intervals.push({
          start: intervalStart,
          end: x,
          type: currentType
        });
        currentType = newType;
        intervalStart = x;
      }
    }

    // Add the last interval
    if (currentType !== null) {
      intervals.push({
        start: intervalStart,
        end: this.domain.max,
        type: currentType
      });
    }

    return intervals;
  }

  /**
   * Perform complete analysis
   */
  analyze(): GraphAnalysis {
    return {
      points: this.generatePoints(),
      criticalPoints: this.findCriticalPoints(),
      inflectionPoints: this.findInflectionPoints(),
      intervals: this.findIntervals(),
      domain: this.domain
    };
  }
}
