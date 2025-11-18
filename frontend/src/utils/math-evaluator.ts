/**
 * 수학 함수식 계산 유틸리티
 * 보안을 위해 제한된 수학 함수만 허용
 */

export class MathEvaluator {
  /**
   * 안전하게 함수식 계산
   * @param expression 함수식 (예: "1/x", "x^2", "sin(x)")
   * @param x x 값
   * @returns y 값 또는 null (정의되지 않은 경우)
   */
  static evaluate(expression: string, x: number): number | null {
    try {
      // 보안: 위험한 코드 실행 방지
      const sanitized = this.sanitizeExpression(expression);

      // x를 실제 값으로 치환
      const replaced = sanitized
        .replace(/\^/g, '**') // x^2 -> x**2
        .replace(/(\d)x/g, '$1*x') // 2x -> 2*x
        .replace(/x/g, `(${x})`);

      // 수학 함수 지원
      const mathContext = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        abs: Math.abs,
        sqrt: Math.sqrt,
        exp: Math.exp,
        log: Math.log,
        ln: Math.log,
        PI: Math.PI,
        E: Math.E
      };

      // 함수 컨텍스트 생성
      const func = new Function(...Object.keys(mathContext), `return ${replaced}`);
      const result = func(...Object.values(mathContext));

      // 유효성 검사
      if (!isFinite(result)) {
        return null;
      }

      return result;
    } catch (error) {
      // 계산 오류 (0으로 나누기 등)
      return null;
    }
  }

  /**
   * 표현식 정제 (보안)
   */
  private static sanitizeExpression(expr: string): string {
    // 공백 제거
    let clean = expr.replace(/\s+/g, '');

    // 허용된 문자만 통과
    const allowed = /^[0-9x+\-*/().^sincotabqrtexplnPI]+$/i;
    if (!allowed.test(clean)) {
      throw new Error('Invalid expression');
    }

    return clean;
  }

  /**
   * 함수의 불연속점 찾기
   */
  static findDiscontinuities(expression: string, domain: [number, number]): number[] {
    const discontinuities: number[] = [];
    const [min, max] = domain;
    const step = 0.1;

    for (let x = min; x <= max; x += step) {
      const y = this.evaluate(expression, x);
      if (y === null) {
        // 정확한 불연속점 찾기 (바이너리 서치)
        const exact = this.findExactDiscontinuity(expression, x - step, x + step);
        if (exact !== null && !discontinuities.includes(Math.round(exact * 10) / 10)) {
          discontinuities.push(Math.round(exact * 10) / 10);
        }
      }
    }

    return discontinuities;
  }

  /**
   * 이진 탐색으로 정확한 불연속점 찾기
   */
  private static findExactDiscontinuity(
    expression: string,
    left: number,
    right: number,
    tolerance: number = 0.001
  ): number | null {
    if (right - left < tolerance) {
      return (left + right) / 2;
    }

    const mid = (left + right) / 2;
    const yMid = this.evaluate(expression, mid);

    if (yMid === null) {
      return mid;
    }

    const yLeft = this.evaluate(expression, left);
    if (yLeft === null) {
      return this.findExactDiscontinuity(expression, left, mid, tolerance);
    }

    return this.findExactDiscontinuity(expression, mid, right, tolerance);
  }
}
