import { EquationParams } from '../types/equation.types';

export const solveEquation = (equation: EquationParams, x: number): number | null => {
  const { type, a = 1, b = 0, c = 0, h = 0, k = 0, r = 1, d = 0 } = equation;

  try {
    switch (type) {
      case 'linear':
        // y = ax + b
        return a * x + b;

      case 'quadratic':
        // y = ax² + bx + c
        return a * x * x + b * x + c;

      case 'circle':
        // (x-h)² + (y-k)² = r²
        // y = k ± √(r² - (x-h)²)
        const underSqrt = r * r - (x - h) * (x - h);
        if (underSqrt < 0) return null;
        return k + Math.sqrt(underSqrt); // 상단 반원만 표시

      case 'sine':
        // y = a·sin(bx + c) + d
        return a * Math.sin(b * x + c) + d;

      case 'cosine':
        // y = a·cos(bx + c) + d
        return a * Math.cos(b * x + c) + d;

      case 'exponential':
        // y = a·e^(bx) + c
        return a * Math.exp(b * x) + c;

      case 'logarithm':
        // y = a·log(bx) + c
        if (b * x <= 0) return null; // 로그는 양수만
        return a * Math.log(b * x) + c;

      default:
        return null;
    }
  } catch (error) {
    console.error('방정식 계산 오류:', error);
    return null;
  }
};

export const formatEquation = (equation: EquationParams): string => {
  const { type, a = 1, b = 0, c = 0, h = 0, k = 0, r = 1, d = 0 } = equation;

  const formatCoef = (coef: number, showPlus = false): string => {
    if (coef === 0) return '';
    const sign = coef > 0 && showPlus ? '+' : '';
    return `${sign}${coef === 1 && !showPlus ? '' : coef === -1 ? '-' : coef}`;
  };

  switch (type) {
    case 'linear':
      return `y = ${formatCoef(a)}x${b !== 0 ? ` ${formatCoef(b, true)}` : ''}`;

    case 'quadratic':
      return `y = ${formatCoef(a)}x²${b !== 0 ? ` ${formatCoef(b, true)}x` : ''}${c !== 0 ? ` ${formatCoef(c, true)}` : ''}`;

    case 'circle':
      return `(x${h !== 0 ? ` - ${h}` : ''})² + (y${k !== 0 ? ` - ${k}` : ''})² = ${r}²`;

    case 'sine':
      return `y = ${formatCoef(a)}sin(${formatCoef(b)}x${c !== 0 ? ` ${formatCoef(c, true)}` : ''})${d !== 0 ? ` ${formatCoef(d, true)}` : ''}`;

    case 'cosine':
      return `y = ${formatCoef(a)}cos(${formatCoef(b)}x${c !== 0 ? ` ${formatCoef(c, true)}` : ''})${d !== 0 ? ` ${formatCoef(d, true)}` : ''}`;

    case 'exponential':
      return `y = ${formatCoef(a)}e^{${formatCoef(b)}x}${c !== 0 ? ` ${formatCoef(c, true)}` : ''}`;

    case 'logarithm':
      return `y = ${formatCoef(a)}\\ln(${formatCoef(b)}x)${c !== 0 ? ` ${formatCoef(c, true)}` : ''}`;

    default:
      return 'Unknown equation';
  }
};
