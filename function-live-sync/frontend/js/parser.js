/**
 * Function Live Sync - Mathematical Expression Parser
 * 수학 함수식 파서 및 계산 엔진
 * 지원: 일차, 이차, 삼차, 지수, 로그, 삼각함수
 */

class FunctionParser {
  constructor() {
    this.variables = { x: 0, e: Math.E, pi: Math.PI };
    this.lastExpression = '';
    this.parsedFunction = null;
  }

  /**
   * 함수식 파싱
   * @param {string} expression - 함수식 (예: "y = 2x + 3", "2*x^2 - 3*x + 1")
   * @returns {object} - { success: boolean, function: Function, error: string }
   */
  parse(expression) {
    try {
      // 공백 제거 및 소문자 변환
      let expr = expression.trim().toLowerCase();

      // "y =" 제거
      expr = expr.replace(/^y\s*=\s*/, '');

      // 수식 정규화
      expr = this.normalizeExpression(expr);

      // 안전성 검증
      if (!this.isSafeExpression(expr)) {
        return {
          success: false,
          error: '허용되지 않은 문자나 함수가 포함되어 있습니다.'
        };
      }

      // 함수 생성
      const funcBody = `
        with (Math) {
          const x = arguments[0];
          try {
            return ${expr};
          } catch (e) {
            return NaN;
          }
        }
      `;

      const func = new Function(funcBody);

      // 테스트 실행
      const testResult = func(0);
      if (typeof testResult !== 'number') {
        return {
          success: false,
          error: '함수 계산 결과가 숫자가 아닙니다.'
        };
      }

      this.lastExpression = expression;
      this.parsedFunction = func;

      return {
        success: true,
        function: func,
        normalizedExpression: expr,
        parameters: this.extractParameters(expr)
      };
    } catch (error) {
      return {
        success: false,
        error: `파싱 오류: ${error.message}`
      };
    }
  }

  /**
   * 수식 정규화 (암시적 곱셈 처리, 함수명 변환 등)
   */
  normalizeExpression(expr) {
    // 2x -> 2*x, 3sin(x) -> 3*sin(x)
    expr = expr.replace(/(\d)([a-z])/g, '$1*$2');
    expr = expr.replace(/(\))(\d)/g, '$1*$2');
    expr = expr.replace(/(\d)(\()/g, '$1*$2');

    // x제곱 표현 변환: x^2 -> Math.pow(x, 2)
    expr = expr.replace(/([a-z0-9.]+)\^([a-z0-9.]+)/gi, 'Math.pow($1, $2)');

    // 삼각함수 변환
    expr = expr.replace(/sin\(/g, 'Math.sin(');
    expr = expr.replace(/cos\(/g, 'Math.cos(');
    expr = expr.replace(/tan\(/g, 'Math.tan(');
    expr = expr.replace(/asin\(/g, 'Math.asin(');
    expr = expr.replace(/acos\(/g, 'Math.acos(');
    expr = expr.replace(/atan\(/g, 'Math.atan(');

    // 로그 함수
    expr = expr.replace(/log\(/g, 'Math.log10(');
    expr = expr.replace(/ln\(/g, 'Math.log(');

    // 기타 수학 함수
    expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
    expr = expr.replace(/abs\(/g, 'Math.abs(');
    expr = expr.replace(/exp\(/g, 'Math.exp(');

    // 상수 변환
    expr = expr.replace(/\bpi\b/g, 'Math.PI');
    expr = expr.replace(/\be\b/g, 'Math.E');

    return expr;
  }

  /**
   * 안전한 수식인지 검증 (코드 인젝션 방지)
   */
  isSafeExpression(expr) {
    // 허용된 문자만 포함하는지 확인
    const allowedPattern = /^[0-9x+\-*/.()^, \t\n\r]+$/i;

    // Math 함수 제거 후 검사
    const withoutMath = expr.replace(/Math\.(sin|cos|tan|asin|acos|atan|log|log10|sqrt|abs|exp|pow|PI|E)/g, '');

    if (!allowedPattern.test(withoutMath)) {
      return false;
    }

    // 위험한 키워드 차단
    const dangerousKeywords = [
      'eval', 'function', 'constructor', 'proto', 'prototype',
      'window', 'document', 'alert', 'console', 'require', 'import'
    ];

    for (const keyword of dangerousKeywords) {
      if (expr.includes(keyword)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 함수 매개변수 추출 (계수, 상수 등)
   */
  extractParameters(expr) {
    const params = {};

    // 일차함수 패턴: mx + b
    const linearMatch = expr.match(/^([+-]?\d*\.?\d*)\*?x\s*([+-]\s*\d+\.?\d*)?$/);
    if (linearMatch) {
      params.type = 'linear';
      params.slope = parseFloat(linearMatch[1] || '1');
      params.intercept = parseFloat(linearMatch[2] || '0');
      return params;
    }

    // 이차함수 패턴: ax^2 + bx + c
    const quadraticMatch = expr.match(/([+-]?\d*\.?\d*)\*?Math\.pow\(x,\s*2\)/);
    if (quadraticMatch) {
      params.type = 'quadratic';
      params.a = parseFloat(quadraticMatch[1] || '1');
      return params;
    }

    // 삼각함수 패턴
    if (expr.includes('Math.sin')) {
      params.type = 'trigonometric';
      params.function = 'sin';
      return params;
    }
    if (expr.includes('Math.cos')) {
      params.type = 'trigonometric';
      params.function = 'cos';
      return params;
    }

    params.type = 'custom';
    return params;
  }

  /**
   * x 값에 대한 y 값 계산
   */
  calculate(x) {
    if (!this.parsedFunction) {
      throw new Error('함수가 파싱되지 않았습니다. parse()를 먼저 호출하세요.');
    }

    try {
      const result = this.parsedFunction(x);
      return isFinite(result) ? result : NaN;
    } catch (error) {
      return NaN;
    }
  }

  /**
   * 그래프 포인트 생성
   * @param {number} xMin - x 최소값
   * @param {number} xMax - x 최대값
   * @param {number} step - 샘플링 간격
   * @returns {Array<{x, y}>} 포인트 배열
   */
  generatePoints(xMin = -10, xMax = 10, step = 0.1) {
    if (!this.parsedFunction) {
      throw new Error('함수가 파싱되지 않았습니다.');
    }

    const points = [];
    for (let x = xMin; x <= xMax; x += step) {
      const y = this.calculate(x);
      if (isFinite(y)) {
        points.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
      }
    }

    return points;
  }

  /**
   * 함수 타입 감지
   */
  detectFunctionType(expression) {
    const expr = expression.toLowerCase();

    if (expr.match(/x\^2/) || expr.includes('pow(x, 2)')) return 'quadratic';
    if (expr.match(/x\^3/) || expr.includes('pow(x, 3)')) return 'cubic';
    if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) return 'trigonometric';
    if (expr.includes('log') || expr.includes('ln')) return 'logarithmic';
    if (expr.includes('exp') || expr.match(/e\^/)) return 'exponential';
    if (expr.match(/^\s*[+-]?\d*\.?\d*\*?x\s*[+-]?\s*\d*\.?\d*\s*$/)) return 'linear';

    return 'custom';
  }

  /**
   * 샘플 함수 제공
   */
  static getSamples() {
    return {
      linear: [
        'y = 2x + 1',
        'y = -0.5x + 3',
        'y = x'
      ],
      quadratic: [
        'y = x^2',
        'y = -x^2 + 4',
        'y = 2x^2 - 3x + 1'
      ],
      cubic: [
        'y = x^3',
        'y = x^3 - 3x'
      ],
      trigonometric: [
        'y = sin(x)',
        'y = cos(x)',
        'y = 2*sin(x)',
        'y = sin(2*x)'
      ],
      logarithmic: [
        'y = ln(x)',
        'y = log(x)'
      ],
      exponential: [
        'y = e^x',
        'y = 2^x'
      ]
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FunctionParser;
}
