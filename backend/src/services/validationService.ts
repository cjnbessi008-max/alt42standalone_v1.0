import { ValidationResult, ValidationRule, MathValidationRule } from '../types';
import { logger } from '../config/logger';

export class ValidationService {
  /**
   * Perform comprehensive checkpoint validation
   */
  static async validateCheckpoint(
    answer: any,
    correctAnswer: any,
    validationRules: ValidationRule
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // 1. Format Validation
    results.push(this.validateFormat(answer, correctAnswer, validationRules));

    // 2. Range Validation (if applicable)
    if (validationRules.min !== undefined || validationRules.max !== undefined) {
      results.push(this.validateRange(answer, validationRules));
    }

    // 3. Logic Validation (problem-type specific)
    results.push(this.validateLogic(answer, correctAnswer, validationRules));

    // 4. Calculation Validation
    results.push(this.validateCalculation(answer, correctAnswer, validationRules));

    return results;
  }

  /**
   * Validate answer format
   */
  private static validateFormat(
    answer: any,
    correctAnswer: any,
    rules: ValidationRule
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'format',
      passed: true,
    };

    try {
      // Check if answer exists
      if (answer === null || answer === undefined || answer === '') {
        result.passed = false;
        result.error_message = '답안이 입력되지 않았습니다.';
        result.suggestions = ['문제를 다시 읽고 답을 입력해주세요.'];
        return result;
      }

      // Check required fields for complex answers
      if (rules.required_fields && typeof answer === 'object') {
        const missingFields = rules.required_fields.filter(
          field => !(field in answer)
        );
        if (missingFields.length > 0) {
          result.passed = false;
          result.error_message = `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`;
          result.suggestions = [`다음 필드를 입력해주세요: ${missingFields.join(', ')}`];
          return result;
        }
      }

      // Type validation
      if (typeof answer !== typeof correctAnswer) {
        // Allow number strings
        if (typeof correctAnswer === 'number' && typeof answer === 'string') {
          const parsed = parseFloat(answer);
          if (isNaN(parsed)) {
            result.passed = false;
            result.error_message = '숫자 형식이 올바르지 않습니다.';
            result.suggestions = ['숫자를 정확히 입력해주세요.'];
            return result;
          }
        } else if (correctAnswer.type && answer.type !== correctAnswer.type) {
          result.warning_message = '답안 형식을 확인해주세요.';
        }
      }

      result.passed = true;
      logger.debug('Format validation passed', { answer });
    } catch (error) {
      logger.error('Format validation error:', error);
      result.passed = false;
      result.error_message = '형식 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate answer is within acceptable range
   */
  private static validateRange(answer: any, rules: ValidationRule): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'range',
      passed: true,
    };

    try {
      const numAnswer = typeof answer === 'number' ? answer : parseFloat(answer);

      if (isNaN(numAnswer)) {
        result.passed = false;
        result.error_message = '숫자가 아닌 값입니다.';
        return result;
      }

      if (rules.min !== undefined && numAnswer < rules.min) {
        result.passed = false;
        result.error_message = `값이 너무 작습니다 (최소: ${rules.min})`;
        result.suggestions = [`${rules.min} 이상의 값을 입력해주세요.`];
      }

      if (rules.max !== undefined && numAnswer > rules.max) {
        result.passed = false;
        result.error_message = `값이 너무 큽니다 (최대: ${rules.max})`;
        result.suggestions = [`${rules.max} 이하의 값을 입력해주세요.`];
      }

      if (result.passed) {
        logger.debug('Range validation passed', { answer: numAnswer, rules });
      }
    } catch (error) {
      logger.error('Range validation error:', error);
      result.passed = false;
      result.error_message = '범위 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate answer logic based on problem type
   */
  private static validateLogic(
    answer: any,
    correctAnswer: any,
    rules: ValidationRule
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'logic',
      passed: true,
    };

    try {
      switch (rules.type) {
        case 'quadratic':
          return this.validateQuadraticLogic(answer, correctAnswer as any, rules as MathValidationRule);

        case 'pythagorean':
          return this.validatePythagoreanLogic(answer, correctAnswer);

        case 'system':
          return this.validateSystemLogic(answer, correctAnswer);

        default:
          // Generic logic validation
          result.passed = true;
          result.warning_message = '특정 로직 검증이 정의되지 않았습니다.';
      }
    } catch (error) {
      logger.error('Logic validation error:', error);
      result.passed = false;
      result.error_message = '로직 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate quadratic equation logic
   */
  private static validateQuadraticLogic(
    answer: any,
    correctAnswer: { solutions: number[]; type: string },
    rules: MathValidationRule
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'logic',
      passed: true,
    };

    try {
      let solutions: number[] = [];

      if (Array.isArray(answer)) {
        solutions = answer.map(x => typeof x === 'number' ? x : parseFloat(x));
      } else if (answer.solutions && Array.isArray(answer.solutions)) {
        solutions = answer.solutions.map((x: any) => typeof x === 'number' ? x : parseFloat(x));
      } else {
        const parsed = typeof answer === 'number' ? answer : parseFloat(answer);
        if (!isNaN(parsed)) {
          solutions = [parsed];
        }
      }

      if (solutions.length === 0 || solutions.some(isNaN)) {
        result.passed = false;
        result.error_message = '해가 올바른 형식이 아닙니다.';
        result.suggestions = ['이차방정식의 해를 배열로 입력해주세요. 예: [2, 3]'];
        return result;
      }

      // Check if number of solutions matches
      if (solutions.length !== correctAnswer.solutions.length) {
        result.warning_message = `해의 개수가 예상과 다릅니다 (입력: ${solutions.length}개, 예상: ${correctAnswer.solutions.length}개)`;
        result.suggestions = ['이차방정식은 보통 2개의 해를 가집니다.'];
      }

      // Check logic: verify solutions actually satisfy the equation
      // For x² - 5x + 6 = 0, check if x² - 5x + 6 = 0 for each solution
      const hasInvalidSolution = solutions.some(x => {
        const check = x * x - 5 * x + 6;
        return Math.abs(check) > (rules.tolerance || 0.01);
      });

      if (hasInvalidSolution) {
        result.passed = false;
        result.error_message = '입력한 해가 방정식을 만족하지 않습니다.';
        result.suggestions = [
          '해를 방정식에 대입하여 확인해보세요.',
          '계산을 다시 확인해보세요.'
        ];
      }

      logger.debug('Quadratic logic validation', { solutions, correctAnswer });
    } catch (error) {
      logger.error('Quadratic logic validation error:', error);
      result.passed = false;
      result.error_message = '이차방정식 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate Pythagorean theorem logic
   */
  private static validatePythagoreanLogic(
    answer: any,
    correctAnswer: { answer: number; type: string }
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'logic',
      passed: true,
    };

    try {
      const numAnswer = typeof answer === 'number' ? answer :
                        (answer.answer ? parseFloat(answer.answer) : parseFloat(answer));

      if (isNaN(numAnswer)) {
        result.passed = false;
        result.error_message = '답이 숫자가 아닙니다.';
        return result;
      }

      // Check if answer is positive (hypotenuse must be positive)
      if (numAnswer <= 0) {
        result.passed = false;
        result.error_message = '빗변의 길이는 양수여야 합니다.';
        result.suggestions = ['계산 결과를 다시 확인해주세요.'];
        return result;
      }

      // Verify Pythagorean theorem: 3² + 4² = c²
      const a = 3, b = 4;
      const expectedSquared = a * a + b * b; // 25
      const answerSquared = numAnswer * numAnswer;

      if (Math.abs(answerSquared - expectedSquared) > 0.01) {
        result.passed = false;
        result.error_message = '피타고라스 정리를 만족하지 않습니다.';
        result.suggestions = [
          'a² + b² = c² 공식을 사용하세요.',
          '3² + 4² = c²를 계산해보세요.'
        ];
      }

      logger.debug('Pythagorean logic validation', { answer: numAnswer, correctAnswer });
    } catch (error) {
      logger.error('Pythagorean logic validation error:', error);
      result.passed = false;
      result.error_message = '피타고라스 정리 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate system of equations logic
   */
  private static validateSystemLogic(
    answer: any,
    correctAnswer: { x: number; y: number; type: string }
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'logic',
      passed: true,
    };

    try {
      const x = typeof answer.x === 'number' ? answer.x : parseFloat(answer.x);
      const y = typeof answer.y === 'number' ? answer.y : parseFloat(answer.y);

      if (isNaN(x) || isNaN(y)) {
        result.passed = false;
        result.error_message = 'x와 y 값이 올바르지 않습니다.';
        result.suggestions = ['x와 y를 모두 입력해주세요.'];
        return result;
      }

      // Verify both equations: 2x + y = 10 and x - y = 2
      const eq1Check = Math.abs((2 * x + y) - 10);
      const eq2Check = Math.abs((x - y) - 2);

      if (eq1Check > 0.01 || eq2Check > 0.01) {
        result.passed = false;
        result.error_message = '입력한 값이 연립방정식을 만족하지 않습니다.';
        result.suggestions = [
          '2x + y = 10 식에 대입해보세요.',
          'x - y = 2 식에 대입해보세요.',
          '두 식을 모두 만족하는지 확인하세요.'
        ];
      }

      logger.debug('System logic validation', { x, y, eq1Check, eq2Check });
    } catch (error) {
      logger.error('System logic validation error:', error);
      result.passed = false;
      result.error_message = '연립방정식 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Validate final calculation/answer correctness
   */
  private static validateCalculation(
    answer: any,
    correctAnswer: any,
    rules: ValidationRule
  ): ValidationResult {
    const result: ValidationResult = {
      validation_type: 'calculation',
      passed: false, // Default to false until proven correct
    };

    try {
      const tolerance = rules.tolerance || 0.01;

      switch (rules.type) {
        case 'quadratic': {
          const solutions = Array.isArray(answer) ? answer :
                           (answer.solutions ? answer.solutions : [answer]);
          const correctSolutions = correctAnswer.solutions;

          // Sort both arrays for comparison
          const sortedAnswer = solutions.map((x: any) =>
            typeof x === 'number' ? x : parseFloat(x)
          ).sort((a: number, b: number) => a - b);

          const sortedCorrect = [...correctSolutions].sort((a, b) => a - b);

          result.passed = sortedAnswer.length === sortedCorrect.length &&
            sortedAnswer.every((val: number, idx: number) =>
              Math.abs(val - sortedCorrect[idx]) <= tolerance
            );

          if (!result.passed) {
            result.error_message = '계산 결과가 정확하지 않습니다.';
            result.suggestions = [
              '계산을 다시 확인해보세요.',
              '근의 공식이나 인수분해를 사용하세요.'
            ];
          }
          break;
        }

        case 'pythagorean': {
          const numAnswer = typeof answer === 'number' ? answer :
                           (answer.answer ? parseFloat(answer.answer) : parseFloat(answer));
          result.passed = Math.abs(numAnswer - correctAnswer.answer) <= tolerance;

          if (!result.passed) {
            result.error_message = '계산 결과가 정확하지 않습니다.';
            result.suggestions = [
              '제곱근 계산을 다시 확인하세요.',
              '√25 = 5 입니다.'
            ];
          }
          break;
        }

        case 'system': {
          const x = typeof answer.x === 'number' ? answer.x : parseFloat(answer.x);
          const y = typeof answer.y === 'number' ? answer.y : parseFloat(answer.y);

          result.passed = Math.abs(x - correctAnswer.x) <= tolerance &&
                         Math.abs(y - correctAnswer.y) <= tolerance;

          if (!result.passed) {
            result.error_message = '계산 결과가 정확하지 않습니다.';
            result.suggestions = [
              'x와 y 값을 다시 계산해보세요.',
              '대입법이나 소거법을 사용하세요.'
            ];
          }
          break;
        }

        default:
          // Generic comparison
          if (typeof answer === 'number' && typeof correctAnswer === 'number') {
            result.passed = Math.abs(answer - correctAnswer) <= tolerance;
          } else {
            result.passed = JSON.stringify(answer) === JSON.stringify(correctAnswer);
          }
      }

      if (result.passed) {
        logger.info('Calculation validation passed', { answer, correctAnswer });
      } else {
        logger.warn('Calculation validation failed', { answer, correctAnswer });
      }
    } catch (error) {
      logger.error('Calculation validation error:', error);
      result.passed = false;
      result.error_message = '계산 검증 중 오류가 발생했습니다.';
    }

    return result;
  }

  /**
   * Calculate score based on validation results
   */
  static calculateScore(
    validations: ValidationResult[],
    maxPoints: number
  ): number {
    const totalValidations = validations.length;
    const passedValidations = validations.filter(v => v.passed).length;

    // Calculation validation is critical - if it fails, max 50% score
    const calcValidation = validations.find(v => v.validation_type === 'calculation');
    if (calcValidation && !calcValidation.passed) {
      return Math.round(maxPoints * 0.3); // 30% for trying
    }

    // Calculate proportional score
    const scoreRatio = passedValidations / totalValidations;
    return Math.round(maxPoints * scoreRatio);
  }
}
