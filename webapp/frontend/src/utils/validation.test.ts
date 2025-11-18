/**
 * 검증 로직 테스트 (Vitest)
 */
import { describe, it, expect } from 'vitest';
import {
  validateBrackets,
  validateSigns,
  validateFormat,
  validateAnswer
} from './validation';

describe('Bracket Validation', () => {
  it('should validate balanced brackets', () => {
    expect(validateBrackets('(2+3)').length).toBe(0);
    expect(validateBrackets('[1+2]').length).toBe(0);
    expect(validateBrackets('{5-3}').length).toBe(0);
    expect(validateBrackets('((2+3)+(4+5))').length).toBe(0);
    expect(validateBrackets('[(2+3)]').length).toBe(0);
  });

  it('should detect unbalanced brackets', () => {
    const errors1 = validateBrackets('(2+3');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('bracket');

    const errors2 = validateBrackets('2+3)');
    expect(errors2.length).toBeGreaterThan(0);
    expect(errors2[0].type).toBe('bracket');
  });

  it('should detect mismatched brackets', () => {
    const errors1 = validateBrackets('(2+3]');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('bracket');

    const errors2 = validateBrackets('[2+3)');
    expect(errors2.length).toBeGreaterThan(0);
    expect(errors2[0].type).toBe('bracket');
  });

  it('should validate nested brackets', () => {
    expect(validateBrackets('((2+3)+(4+5))').length).toBe(0);
    expect(validateBrackets('[(2+3)+(4+5)]').length).toBe(0);

    const errors = validateBrackets('((2+3)');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('Sign Validation', () => {
  it('should validate correct sign usage', () => {
    expect(validateSigns('2+3').length).toBe(0);
    expect(validateSigns('5-2').length).toBe(0);
    expect(validateSigns('2×3').length).toBe(0);
    expect(validateSigns('6÷2').length).toBe(0);
    expect(validateSigns('2+3-4').length).toBe(0);
  });

  it('should detect consecutive operators', () => {
    const errors1 = validateSigns('2++3');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('sign');

    const errors2 = validateSigns('2--3');
    expect(errors2.length).toBeGreaterThan(0);
  });

  it('should detect trailing operators', () => {
    const errors1 = validateSigns('2+3+');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('sign');

    const errors2 = validateSigns('5-');
    expect(errors2.length).toBeGreaterThan(0);
  });
});

describe('Format Validation', () => {
  it('should validate correct format', () => {
    expect(validateFormat('2+3').length).toBe(0);
    expect(validateFormat('(2+3)×5').length).toBe(0);
    expect(validateFormat('1/2+3/4').length).toBe(0);
    expect(validateFormat('2.5+3.7').length).toBe(0);
  });

  it('should detect empty input', () => {
    const errors1 = validateFormat('');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('format');

    const errors2 = validateFormat('   ');
    expect(errors2.length).toBeGreaterThan(0);
  });

  it('should detect invalid characters', () => {
    const errors1 = validateFormat('2+3abc');
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].type).toBe('format');

    const errors2 = validateFormat('2+3!');
    expect(errors2.length).toBeGreaterThan(0);
  });
});

describe('Full Validation', () => {
  it('should validate correct answers', () => {
    const result1 = validateAnswer('2+3');
    expect(result1.isValid).toBe(true);
    expect(result1.errors.length).toBe(0);

    const result2 = validateAnswer('(2+3)×5');
    expect(result2.isValid).toBe(true);

    const result3 = validateAnswer('1/2+3/4');
    expect(result3.isValid).toBe(true);
  });

  it('should detect invalid answers', () => {
    const result1 = validateAnswer('(2+3');
    expect(result1.isValid).toBe(false);
    expect(result1.errors.length).toBeGreaterThan(0);

    const result2 = validateAnswer('2++3');
    expect(result2.isValid).toBe(false);
    expect(result2.errors.length).toBeGreaterThan(0);

    const result3 = validateAnswer('');
    expect(result3.isValid).toBe(false);
    expect(result3.errors.length).toBeGreaterThan(0);
  });

  it('should validate complex expressions', () => {
    const result1 = validateAnswer('((2+3)×(4-1))/5');
    expect(result1.isValid).toBe(true);

    const result2 = validateAnswer('[(2+3)×4]-[5÷(2-1)]');
    expect(result2.isValid).toBe(true);
  });
});
