import { create, all, MathNode } from 'mathjs';

const math = create(all);

export class MathEngine {
  private expression: string;
  private compiledFunc: any;
  private firstDerivative: MathNode | null = null;
  private secondDerivative: MathNode | null = null;

  constructor(expression: string) {
    this.expression = expression;
    try {
      const node = math.parse(expression);
      this.compiledFunc = node.compile();

      // Calculate first derivative
      this.firstDerivative = math.derivative(node, 'x');

      // Calculate second derivative
      if (this.firstDerivative) {
        this.secondDerivative = math.derivative(this.firstDerivative, 'x');
      }
    } catch (error) {
      throw new Error(`Failed to parse expression: ${error}`);
    }
  }

  evaluate(x: number): number {
    try {
      return this.compiledFunc.evaluate({ x });
    } catch (error) {
      return NaN;
    }
  }

  evaluateFirstDerivative(x: number): number {
    if (!this.firstDerivative) return NaN;
    try {
      return this.firstDerivative.compile().evaluate({ x });
    } catch (error) {
      return NaN;
    }
  }

  evaluateSecondDerivative(x: number): number {
    if (!this.secondDerivative) return NaN;
    try {
      return this.secondDerivative.compile().evaluate({ x });
    } catch (error) {
      return NaN;
    }
  }

  getFirstDerivativeExpression(): string {
    if (!this.firstDerivative) return '';
    return this.firstDerivative.toString();
  }

  getSecondDerivativeExpression(): string {
    if (!this.secondDerivative) return '';
    return this.secondDerivative.toString();
  }

  /**
   * Find roots using Newton-Raphson method
   */
  findRoots(initialGuesses: number[], tolerance: number = 0.0001, maxIterations: number = 100): number[] {
    const roots: number[] = [];

    for (const guess of initialGuesses) {
      let x = guess;
      let iteration = 0;

      while (iteration < maxIterations) {
        const fx = this.evaluate(x);
        const fpx = this.evaluateFirstDerivative(x);

        if (Math.abs(fpx) < 1e-10) break; // Avoid division by zero

        const xNew = x - fx / fpx;

        if (Math.abs(xNew - x) < tolerance) {
          // Check if this root is already found
          const isDuplicate = roots.some(r => Math.abs(r - xNew) < tolerance);
          if (!isDuplicate && !isNaN(xNew) && isFinite(xNew)) {
            roots.push(xNew);
          }
          break;
        }

        x = xNew;
        iteration++;
      }
    }

    return roots.sort((a, b) => a - b);
  }

  /**
   * Find critical points where f'(x) = 0
   */
  findCriticalPoints(domain: { min: number; max: number }): number[] {
    if (!this.firstDerivative) return [];

    const step = (domain.max - domain.min) / 50;
    const initialGuesses: number[] = [];

    // Find sign changes in first derivative
    for (let x = domain.min; x < domain.max; x += step) {
      const y1 = this.evaluateFirstDerivative(x);
      const y2 = this.evaluateFirstDerivative(x + step);

      if (y1 * y2 < 0) {
        initialGuesses.push(x + step / 2);
      }
    }

    // Create temporary engine for first derivative
    const derivativeEngine = new MathEngine(this.getFirstDerivativeExpression());
    return derivativeEngine.findRoots(initialGuesses);
  }

  /**
   * Find inflection points where f''(x) = 0
   */
  findInflectionPoints(domain: { min: number; max: number }): number[] {
    if (!this.secondDerivative) return [];

    const step = (domain.max - domain.min) / 50;
    const initialGuesses: number[] = [];

    // Find sign changes in second derivative
    for (let x = domain.min; x < domain.max; x += step) {
      const y1 = this.evaluateSecondDerivative(x);
      const y2 = this.evaluateSecondDerivative(x + step);

      if (y1 * y2 < 0) {
        initialGuesses.push(x + step / 2);
      }
    }

    // Create temporary engine for second derivative
    const derivativeEngine = new MathEngine(this.getSecondDerivativeExpression());
    return derivativeEngine.findRoots(initialGuesses);
  }
}
