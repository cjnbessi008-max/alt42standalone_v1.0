import { MathTerm, MathExpression } from '@/types/math';

/**
 * Parse a mathematical expression string into structured terms
 * 수학 수식 문자열을 구조화된 항으로 파싱
 *
 * Examples:
 * - "2x + 3y - 5" → [{2, x}, {3, y}, {-5}]
 * - "x^2 + 2x + 1" → [{1, x, 2}, {2, x}, {1}]
 */
export class MathParser {
  private static termIdCounter = 0;

  /**
   * Generate unique term ID
   */
  private static generateTermId(): string {
    return `term_${this.termIdCounter++}`;
  }

  /**
   * Parse simple polynomial expression
   * 간단한 다항식 파싱
   */
  static parseExpression(expression: string): MathExpression {
    // Remove all whitespace
    const cleaned = expression.replace(/\s+/g, '');

    // Split by + and - while keeping the operators
    const regex = /([+-]?)([^+-]+)/g;
    const matches = [...cleaned.matchAll(regex)].filter(m => m[2]);

    const terms: MathTerm[] = matches.map((match, index) => {
      const sign = match[1] === '-' ? -1 : 1;
      const termStr = match[2];

      return this.parseTerm(termStr, sign, index);
    });

    return {
      id: `expr_${Date.now()}`,
      terms,
      latex: this.toLatex(terms),
    };
  }

  /**
   * Parse a single term
   * 단일 항 파싱
   */
  private static parseTerm(termStr: string, sign: number, index: number): MathTerm {
    // Match pattern: coefficient * variable ^ exponent
    // Examples: 2x, 3x^2, -5, x, x^3
    const match = termStr.match(/^(-?\d*\.?\d*)([a-z]?)(\^(\d+))?$/i);

    if (!match) {
      throw new Error(`Invalid term: ${termStr}`);
    }

    const [, coeffStr, variable, , exponentStr] = match;

    // Parse coefficient
    let coefficient = 1;
    if (coeffStr === '' || coeffStr === '+') {
      coefficient = 1;
    } else if (coeffStr === '-') {
      coefficient = -1;
    } else {
      coefficient = parseFloat(coeffStr);
    }
    coefficient *= sign;

    // Parse exponent
    const exponent = exponentStr ? parseInt(exponentStr, 10) : (variable ? 1 : undefined);

    return {
      id: this.generateTermId(),
      coefficient,
      variable: variable || undefined,
      exponent,
      isConstant: !variable,
      originalIndex: index,
    };
  }

  /**
   * Convert terms to LaTeX format
   * 항들을 LaTeX 형식으로 변환
   */
  static toLatex(terms: MathTerm[]): string {
    if (terms.length === 0) return '0';

    return terms.map((term, index) => {
      let latex = '';

      // Add sign for non-first terms
      if (index > 0) {
        latex += term.coefficient >= 0 ? ' + ' : ' - ';
      } else if (term.coefficient < 0) {
        latex += '-';
      }

      // Coefficient
      const absCoeff = Math.abs(term.coefficient);
      if (term.isConstant) {
        latex += absCoeff.toString();
      } else if (absCoeff !== 1) {
        latex += absCoeff.toString();
      }

      // Variable
      if (term.variable) {
        latex += term.variable;

        // Exponent
        if (term.exponent && term.exponent !== 1) {
          latex += `^{${term.exponent}}`;
        }
      }

      return latex;
    }).join('');
  }

  /**
   * Simplify expression by combining like terms
   * 동류항 결합으로 수식 간소화
   */
  static simplify(expression: MathExpression): MathExpression {
    const termGroups = new Map<string, MathTerm[]>();

    // Group like terms
    expression.terms.forEach(term => {
      const key = `${term.variable || 'const'}_${term.exponent || 0}`;
      if (!termGroups.has(key)) {
        termGroups.set(key, []);
      }
      termGroups.get(key)!.push(term);
    });

    // Combine coefficients
    const simplifiedTerms: MathTerm[] = [];
    termGroups.forEach((terms) => {
      const combinedCoeff = terms.reduce((sum, t) => sum + t.coefficient, 0);

      if (combinedCoeff !== 0) {
        const firstTerm = terms[0];
        simplifiedTerms.push({
          id: this.generateTermId(),
          coefficient: combinedCoeff,
          variable: firstTerm.variable,
          exponent: firstTerm.exponent,
          isConstant: firstTerm.isConstant,
          originalIndex: firstTerm.originalIndex,
        });
      }
    });

    // Sort: variables with higher exponents first, then constants
    simplifiedTerms.sort((a, b) => {
      if (a.isConstant && !b.isConstant) return 1;
      if (!a.isConstant && b.isConstant) return -1;
      if (a.variable === b.variable) {
        return (b.exponent || 0) - (a.exponent || 0);
      }
      return (a.variable || '').localeCompare(b.variable || '');
    });

    return {
      id: `expr_${Date.now()}`,
      terms: simplifiedTerms,
      latex: this.toLatex(simplifiedTerms),
    };
  }
}
