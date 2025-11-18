import type { RecurrenceProblem, RecurrenceStep } from '../types';

/**
 * Recurrence Relation Calculator
 * Computes values based on recurrence formula
 */
export class RecurrenceCalculator {
  /**
   * Calculate all steps for a given recurrence problem
   */
  static calculateSteps(problem: RecurrenceProblem): RecurrenceStep[] {
    const steps: RecurrenceStep[] = [];
    const values: { [key: number]: number } = {};

    // Initialize with initial conditions
    Object.entries(problem.initialConditions).forEach(([key, value]) => {
      const index = parseInt(key.replace(/\D/g, ''), 10);
      values[index] = value;
      steps.push({
        index,
        value,
        formula: `f(${index}) = ${value} (초기값)`,
        dependencies: [],
      });
    });

    // Calculate remaining steps
    const startIndex = Math.max(...Object.keys(values).map(Number)) + 1;

    for (let n = startIndex; n < problem.maxSteps; n++) {
      const result = this.evaluateFormula(problem.formula, n, values);
      values[n] = result.value;

      steps.push({
        index: n,
        value: result.value,
        formula: result.formula,
        dependencies: result.dependencies,
      });
    }

    return steps;
  }

  /**
   * Evaluate a recurrence formula for a given index
   */
  private static evaluateFormula(
    formula: string,
    n: number,
    values: { [key: number]: number }
  ): { value: number; formula: string; dependencies: number[] } {
    const dependencies: number[] = [];
    let result: number;
    let expandedFormula = formula;

    // Parse common recurrence patterns
    if (formula.includes('f(n-1) + f(n-2)')) {
      // Fibonacci-style: f(n) = f(n-1) + f(n-2)
      const prev1 = values[n - 1];
      const prev2 = values[n - 2];
      result = prev1 + prev2;
      dependencies.push(n - 1, n - 2);
      expandedFormula = `f(${n}) = f(${n - 1}) + f(${n - 2}) = ${prev1} + ${prev2} = ${result}`;
    } else if (formula.includes('n × f(n-1)') || formula.includes('n * f(n-1)')) {
      // Factorial-style: f(n) = n × f(n-1)
      const prev = values[n - 1];
      result = n * prev;
      dependencies.push(n - 1);
      expandedFormula = `f(${n}) = ${n} × f(${n - 1}) = ${n} × ${prev} = ${result}`;
    } else if (formula.includes('f(n-1) + 2')) {
      // Arithmetic progression: f(n) = f(n-1) + 2
      const prev = values[n - 1];
      result = prev + 2;
      dependencies.push(n - 1);
      expandedFormula = `f(${n}) = f(${n - 1}) + 2 = ${prev} + 2 = ${result}`;
    } else if (formula.includes('2 × f(n-1)') || formula.includes('2 * f(n-1)')) {
      // Geometric progression: f(n) = 2 × f(n-1)
      const prev = values[n - 1];
      result = 2 * prev;
      dependencies.push(n - 1);
      expandedFormula = `f(${n}) = 2 × f(${n - 1}) = 2 × ${prev} = ${result}`;
    } else {
      // Default: try to parse simple patterns
      const prev = values[n - 1] || 0;
      result = prev;
      dependencies.push(n - 1);
      expandedFormula = `f(${n}) = ${result}`;
    }

    return { value: result, formula: expandedFormula, dependencies };
  }

  /**
   * Format a value for display (handle large numbers)
   */
  static formatValue(value: number): string {
    if (value > 1000000) {
      return value.toExponential(2);
    }
    return value.toLocaleString();
  }
}
