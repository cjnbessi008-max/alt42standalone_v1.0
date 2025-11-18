/**
 * 적분 문제 분석 및 핵심 규칙 추출 엔진
 */

import type {
  IntegralProblem,
  IntegralType,
  CoreRule,
  IntegralStep,
  HighlightedPart,
} from '../types/IntegralProblem.js';

export class IntegralAnalyzer {
  private coreRules: Map<string, CoreRule>;

  constructor() {
    this.coreRules = new Map();
    this.initializeCoreRules();
  }

  /**
   * 핵심 적분 규칙 초기화
   */
  private initializeCoreRules(): void {
    const rules: CoreRule[] = [
      {
        ruleId: 'power_rule',
        ruleName: '거듭제곱 법칙',
        ruleFormula: '∫ x^n dx = x^(n+1)/(n+1) + C',
        ruleLatex: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)',
        description: '변수의 거듭제곱을 적분할 때 지수를 1 증가시키고 새 지수로 나눕니다',
        category: 'power_rule',
      },
      {
        ruleId: 'constant_multiple',
        ruleName: '상수배 규칙',
        ruleFormula: '∫ k·f(x) dx = k·∫ f(x) dx',
        ruleLatex: '\\int k \\cdot f(x) \\, dx = k \\int f(x) \\, dx',
        description: '상수는 적분 기호 밖으로 빼낼 수 있습니다',
        category: 'power_rule',
      },
      {
        ruleId: 'sum_rule',
        ruleName: '합의 법칙',
        ruleFormula: '∫ [f(x) + g(x)] dx = ∫ f(x) dx + ∫ g(x) dx',
        ruleLatex: '\\int [f(x) + g(x)] \\, dx = \\int f(x) \\, dx + \\int g(x) \\, dx',
        description: '두 함수의 합의 적분은 각 함수 적분의 합입니다',
        category: 'power_rule',
      },
      {
        ruleId: 'exp_rule',
        ruleName: '지수함수 적분',
        ruleFormula: '∫ e^x dx = e^x + C',
        ruleLatex: '\\int e^x \\, dx = e^x + C',
        description: '자연상수 e의 x승 적분은 자기 자신입니다',
        category: 'exponential',
      },
      {
        ruleId: 'ln_rule',
        ruleName: '로그함수 적분',
        ruleFormula: '∫ (1/x) dx = ln|x| + C',
        ruleLatex: '\\int \\frac{1}{x} \\, dx = \\ln|x| + C',
        description: '1/x의 적분은 자연로그입니다',
        category: 'logarithmic',
      },
      {
        ruleId: 'sin_rule',
        ruleName: '사인함수 적분',
        ruleFormula: '∫ sin(x) dx = -cos(x) + C',
        ruleLatex: '\\int \\sin(x) \\, dx = -\\cos(x) + C',
        description: 'sin(x)의 적분은 -cos(x)입니다',
        category: 'trigonometric',
      },
      {
        ruleId: 'cos_rule',
        ruleName: '코사인함수 적분',
        ruleFormula: '∫ cos(x) dx = sin(x) + C',
        ruleLatex: '\\int \\cos(x) \\, dx = \\sin(x) + C',
        description: 'cos(x)의 적분은 sin(x)입니다',
        category: 'trigonometric',
      },
      {
        ruleId: 'substitution',
        ruleName: '치환적분',
        ruleFormula: '∫ f(g(x))·g\'(x) dx = ∫ f(u) du',
        ruleLatex: '\\int f(g(x)) \\cdot g\'(x) \\, dx = \\int f(u) \\, du',
        description: 'u = g(x)로 치환하여 적분을 간단하게 만듭니다',
        category: 'substitution',
      },
      {
        ruleId: 'parts',
        ruleName: '부분적분',
        ruleFormula: '∫ u dv = uv - ∫ v du',
        ruleLatex: '\\int u \\, dv = uv - \\int v \\, du',
        description: '두 함수의 곱을 적분할 때 사용합니다',
        category: 'integration_by_parts',
      },
    ];

    rules.forEach((rule) => {
      this.coreRules.set(rule.ruleId, rule);
    });
  }

  /**
   * LaTeX 수식을 분석하여 적분 타입 판별
   */
  analyzeIntegralType(latex: string): IntegralType {
    // 거듭제곱 법칙 패턴
    if (/x\^[\d\-]+/.test(latex) || /x\^\{[\d\-]+\}/.test(latex)) {
      return 'power_rule';
    }

    // 지수함수
    if (/e\^/.test(latex)) {
      return 'exponential';
    }

    // 로그함수
    if (/\\ln|\\log|\\frac\{1\}\{x\}/.test(latex)) {
      return 'logarithmic';
    }

    // 삼각함수
    if (/\\sin|\\cos|\\tan/.test(latex)) {
      return 'trigonometric';
    }

    // 치환적분 (복잡한 합성함수 패턴)
    if (/\(.*\)\^[\d\-]+.*\\cdot/.test(latex)) {
      return 'substitution';
    }

    // 부분적분 (곱셈 패턴)
    if (/\\cdot/.test(latex) && (/x\^[\d]+/.test(latex) || /\\ln/.test(latex))) {
      return 'integration_by_parts';
    }

    // 정적분 (적분 한계 포함)
    if (/_\{.*\}\^\{.*\}/.test(latex)) {
      return 'definite';
    }

    return 'power_rule'; // 기본값
  }

  /**
   * 적분 문제를 분석하고 핵심 규칙 추출
   */
  analyzeProblem(latex: string, problemText: string): IntegralProblem {
    const integralType = this.analyzeIntegralType(latex);
    const coreRules = this.extractCoreRules(latex, integralType);
    const steps = this.generateSteps(latex, integralType, coreRules);

    return {
      id: this.generateId(),
      problemText,
      latex,
      difficulty: this.assessDifficulty(latex, integralType),
      integralType,
      coreRules,
      steps,
    };
  }

  /**
   * 적분 타입에 따라 적용 가능한 핵심 규칙 추출
   */
  private extractCoreRules(latex: string, type: IntegralType): CoreRule[] {
    const rules: CoreRule[] = [];

    switch (type) {
      case 'power_rule':
        if (this.coreRules.has('power_rule')) {
          rules.push(this.coreRules.get('power_rule')!);
        }
        if (/[\d]+.*x/.test(latex) && this.coreRules.has('constant_multiple')) {
          rules.push(this.coreRules.get('constant_multiple')!);
        }
        if (/\+|-/.test(latex) && this.coreRules.has('sum_rule')) {
          rules.push(this.coreRules.get('sum_rule')!);
        }
        break;

      case 'exponential':
        if (this.coreRules.has('exp_rule')) {
          rules.push(this.coreRules.get('exp_rule')!);
        }
        break;

      case 'logarithmic':
        if (this.coreRules.has('ln_rule')) {
          rules.push(this.coreRules.get('ln_rule')!);
        }
        break;

      case 'trigonometric':
        if (/\\sin/.test(latex) && this.coreRules.has('sin_rule')) {
          rules.push(this.coreRules.get('sin_rule')!);
        }
        if (/\\cos/.test(latex) && this.coreRules.has('cos_rule')) {
          rules.push(this.coreRules.get('cos_rule')!);
        }
        break;

      case 'substitution':
        if (this.coreRules.has('substitution')) {
          rules.push(this.coreRules.get('substitution')!);
        }
        break;

      case 'integration_by_parts':
        if (this.coreRules.has('parts')) {
          rules.push(this.coreRules.get('parts')!);
        }
        break;
    }

    return rules;
  }

  /**
   * 단계별 풀이 생성
   */
  private generateSteps(
    latex: string,
    type: IntegralType,
    coreRules: CoreRule[]
  ): IntegralStep[] {
    const steps: IntegralStep[] = [];

    // 예시: x^2 적분
    if (type === 'power_rule') {
      const powerMatch = latex.match(/x\^([\d\-]+)/);
      if (powerMatch) {
        const n = parseInt(powerMatch[1]);
        const nPlus1 = n + 1;

        steps.push({
          stepNumber: 1,
          description: `거듭제곱 법칙 적용: n = ${n}`,
          latex: `\\int x^{${n}} \\, dx`,
          appliedRule: coreRules.find((r) => r.ruleId === 'power_rule'),
          highlightedParts: [
            {
              partId: 'exponent',
              latex: `x^{${n}}`,
              color: '#ff6b6b',
              label: '피적분함수',
              tooltipText: `지수 ${n}을 1 증가시켜 ${nPlus1}로 만듭니다`,
            },
          ],
        });

        steps.push({
          stepNumber: 2,
          description: `지수를 1 증가: ${n} → ${nPlus1}`,
          latex: `\\frac{x^{${nPlus1}}}{${nPlus1}}`,
          highlightedParts: [
            {
              partId: 'new_exponent',
              latex: `x^{${nPlus1}}`,
              color: '#4ecdc4',
              label: '증가된 지수',
            },
            {
              partId: 'divisor',
              latex: `${nPlus1}`,
              color: '#45b7d1',
              label: '새 지수로 나누기',
            },
          ],
        });

        steps.push({
          stepNumber: 3,
          description: '적분 상수 추가',
          latex: `\\frac{x^{${nPlus1}}}{${nPlus1}} + C`,
          highlightedParts: [
            {
              partId: 'constant',
              latex: 'C',
              color: '#96ceb4',
              label: '적분 상수',
              tooltipText: '부정적분에는 항상 적분 상수를 추가합니다',
            },
          ],
        });
      }
    }

    return steps;
  }

  /**
   * 난이도 평가
   */
  private assessDifficulty(latex: string, type: IntegralType): 'easy' | 'medium' | 'hard' {
    // 간단한 휴리스틱 기반 난이도 평가
    const complexity =
      (latex.match(/\\/g) || []).length + // LaTeX 명령어 개수
      (latex.match(/\{/g) || []).length; // 중괄호 개수

    if (type === 'integration_by_parts' || type === 'substitution') {
      return 'hard';
    }

    if (complexity > 15) return 'hard';
    if (complexity > 8) return 'medium';
    return 'easy';
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `integral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 모든 핵심 규칙 가져오기
   */
  getAllCoreRules(): CoreRule[] {
    return Array.from(this.coreRules.values());
  }

  /**
   * 특정 규칙 가져오기
   */
  getCoreRule(ruleId: string): CoreRule | undefined {
    return this.coreRules.get(ruleId);
  }
}
