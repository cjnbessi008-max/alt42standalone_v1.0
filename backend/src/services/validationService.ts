import { Fraction, ValidationResult, ErrorType, FractionProblemData } from '../types';

/**
 * Validation Service - Rule-based calculation error detection
 */
export class ValidationService {
  /**
   * Calculate GCD (Greatest Common Divisor) using Euclidean algorithm
   */
  private gcd(a: number, b: number): number {
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
   * Simplify a fraction to its lowest terms
   */
  public simplifyFraction(fraction: Fraction): Fraction {
    if (fraction.denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }

    const divisor = this.gcd(fraction.numerator, fraction.denominator);
    return {
      numerator: fraction.numerator / divisor,
      denominator: fraction.denominator / divisor,
    };
  }

  /**
   * Check if two fractions are equivalent
   */
  public areFractionsEquivalent(f1: Fraction, f2: Fraction): boolean {
    if (f1.denominator === 0 || f2.denominator === 0) {
      return false;
    }

    const simplified1 = this.simplifyFraction(f1);
    const simplified2 = this.simplifyFraction(f2);

    return (
      simplified1.numerator === simplified2.numerator &&
      simplified1.denominator === simplified2.denominator
    );
  }

  /**
   * Validate fraction format
   */
  public isValidFraction(fraction: Fraction): { valid: boolean; error?: string } {
    if (typeof fraction.numerator !== 'number' || typeof fraction.denominator !== 'number') {
      return { valid: false, error: 'Numerator and denominator must be numbers' };
    }

    if (!Number.isInteger(fraction.numerator) || !Number.isInteger(fraction.denominator)) {
      return { valid: false, error: 'Numerator and denominator must be integers' };
    }

    if (fraction.denominator === 0) {
      return { valid: false, error: 'Denominator cannot be zero' };
    }

    return { valid: true };
  }

  /**
   * Add two fractions
   */
  public addFractions(f1: Fraction, f2: Fraction): Fraction {
    const numerator = f1.numerator * f2.denominator + f2.numerator * f1.denominator;
    const denominator = f1.denominator * f2.denominator;
    return this.simplifyFraction({ numerator, denominator });
  }

  /**
   * Subtract two fractions
   */
  public subtractFractions(f1: Fraction, f2: Fraction): Fraction {
    const numerator = f1.numerator * f2.denominator - f2.numerator * f1.denominator;
    const denominator = f1.denominator * f2.denominator;
    return this.simplifyFraction({ numerator, denominator });
  }

  /**
   * Multiply two fractions
   */
  public multiplyFractions(f1: Fraction, f2: Fraction): Fraction {
    const numerator = f1.numerator * f2.numerator;
    const denominator = f1.denominator * f2.denominator;
    return this.simplifyFraction({ numerator, denominator });
  }

  /**
   * Divide two fractions
   */
  public divideFractions(f1: Fraction, f2: Fraction): Fraction {
    if (f2.numerator === 0) {
      throw new Error('Cannot divide by zero');
    }
    return this.multiplyFractions(f1, { numerator: f2.denominator, denominator: f2.numerator });
  }

  /**
   * Detect the type of error in student's answer
   */
  private detectErrorType(
    studentAnswer: Fraction,
    correctAnswer: Fraction,
    problemData: FractionProblemData
  ): ErrorType {
    // Check if it's just a simplification error (correct value but not simplified)
    if (this.areFractionsEquivalent(studentAnswer, correctAnswer)) {
      return null; // Equivalent, so no real error
    }

    // Check for common conceptual errors
    const { operation, numerator1, denominator1, numerator2, denominator2 } = problemData;

    if (operation === 'add' || operation === 'subtract') {
      // Common mistake: adding/subtracting numerators and denominators separately
      const wrongNumerator =
        operation === 'add' ? numerator1 + (numerator2 || 0) : numerator1 - (numerator2 || 0);
      const wrongDenominator =
        operation === 'add' ? denominator1 + (denominator2 || 0) : denominator1 - (denominator2 || 0);

      if (
        studentAnswer.numerator === wrongNumerator &&
        studentAnswer.denominator === wrongDenominator
      ) {
        return 'conceptual_error';
      }

      // Check if only numerators were added/subtracted (forgot to find common denominator)
      if (
        denominator1 === denominator2 &&
        studentAnswer.denominator === denominator1 &&
        studentAnswer.numerator === wrongNumerator
      ) {
        return 'conceptual_error';
      }
    }

    if (operation === 'multiply') {
      // Check if student added instead of multiplied
      const addResult = this.addFractions(
        { numerator: numerator1, denominator: denominator1 },
        { numerator: numerator2 || 0, denominator: denominator2 || 1 }
      );
      if (this.areFractionsEquivalent(studentAnswer, addResult)) {
        return 'conceptual_error';
      }
    }

    // Check for arithmetic errors (small calculation mistakes)
    const correctNumerator = correctAnswer.numerator;
    const correctDenominator = correctAnswer.denominator;
    const numeratorDiff = Math.abs(studentAnswer.numerator - correctNumerator);
    const denominatorDiff = Math.abs(studentAnswer.denominator - correctDenominator);

    // If the difference is small (within 10), likely an arithmetic error
    if (numeratorDiff <= 10 && denominatorDiff <= 10 && (numeratorDiff > 0 || denominatorDiff > 0)) {
      return 'arithmetic_error';
    }

    // Check if it's just not simplified
    const simplified = this.simplifyFraction(studentAnswer);
    if (this.areFractionsEquivalent(simplified, correctAnswer)) {
      return 'simplification_error';
    }

    // Default to arithmetic error if we can't classify it
    return 'arithmetic_error';
  }

  /**
   * Validate student answer against correct answer
   */
  public validateAnswer(
    studentAnswer: Fraction,
    correctAnswer: Fraction,
    problemData: FractionProblemData
  ): ValidationResult {
    // First check format validity
    const formatCheck = this.isValidFraction(studentAnswer);
    if (!formatCheck.valid) {
      return {
        is_correct: false,
        is_equivalent: false,
        error_type: 'format_error',
      };
    }

    // Check if exactly correct
    const isExactMatch =
      studentAnswer.numerator === correctAnswer.numerator &&
      studentAnswer.denominator === correctAnswer.denominator;

    if (isExactMatch) {
      return {
        is_correct: true,
        is_equivalent: false,
        error_type: null,
      };
    }

    // Check if equivalent (correct but not simplified)
    const isEquivalent = this.areFractionsEquivalent(studentAnswer, correctAnswer);

    if (isEquivalent) {
      return {
        is_correct: true,
        is_equivalent: true,
        error_type: null,
      };
    }

    // Answer is incorrect - detect error type
    const errorType = this.detectErrorType(studentAnswer, correctAnswer, problemData);

    return {
      is_correct: false,
      is_equivalent: false,
      error_type: errorType,
    };
  }

  /**
   * Calculate the correct answer for a problem
   */
  public calculateCorrectAnswer(problemData: FractionProblemData): Fraction {
    const f1: Fraction = {
      numerator: problemData.numerator1,
      denominator: problemData.denominator1,
    };

    const f2: Fraction = {
      numerator: problemData.numerator2 || 0,
      denominator: problemData.denominator2 || 1,
    };

    switch (problemData.operation) {
      case 'add':
        return this.addFractions(f1, f2);
      case 'subtract':
        return this.subtractFractions(f1, f2);
      case 'multiply':
        return this.multiplyFractions(f1, f2);
      case 'divide':
        return this.divideFractions(f1, f2);
      case 'simplify':
        return this.simplifyFraction(f1);
      case 'identify':
        return f1;
      default:
        throw new Error(`Unknown operation: ${problemData.operation}`);
    }
  }
}

export default new ValidationService();
