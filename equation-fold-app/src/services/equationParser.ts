import { parse, simplify, SymbolNode, OperatorNode } from 'mathjs';
import { EquationStep } from '../types/equation';

/**
 * 수식을 단계별로 단순화하는 서비스
 */
export class EquationParser {
  /**
   * 수식을 파싱하고 단계별 변환 단계를 생성
   */
  static parseAndSimplify(expression: string): EquationStep[] {
    const steps: EquationStep[] = [];

    try {
      // 1단계: 원본 수식
      steps.push({
        expression: expression,
        description: '원래 식',
        expanded: true
      });

      // 2단계: 괄호 전개
      const expanded = this.expandBrackets(expression);
      if (expanded !== expression) {
        steps.push({
          expression: expanded,
          description: '분배 법칙 적용 (괄호 전개)',
          expanded: false
        });
      }

      // 3단계: 항 정리
      const collected = this.collectTerms(expanded);
      if (collected !== expanded) {
        steps.push({
          expression: collected,
          description: '동류항 정리',
          expanded: false
        });
      }

      // 4단계: 최종 단순화
      const simplified = this.simplifyExpression(collected);
      if (simplified !== collected) {
        steps.push({
          expression: simplified,
          description: '최종 단순화',
          expanded: false
        });
      }

      return steps;
    } catch (error) {
      console.error('수식 파싱 오류:', error);
      return [{
        expression: expression,
        description: '오류: 수식을 파싱할 수 없습니다',
        expanded: true
      }];
    }
  }

  /**
   * 괄호를 전개
   */
  private static expandBrackets(expression: string): string {
    try {
      const node = parse(expression);
      const expanded = simplify(node, [
        'distribute'
      ]);
      return expanded.toString();
    } catch {
      return expression;
    }
  }

  /**
   * 동류항 정리
   */
  private static collectTerms(expression: string): string {
    try {
      const node = parse(expression);
      const collected = simplify(node, [
        'n1*n2 -> n1*n2',
        'n1+n2 -> n1+n2',
        'collect'
      ]);
      return collected.toString();
    } catch {
      return expression;
    }
  }

  /**
   * 수식 단순화
   */
  private static simplifyExpression(expression: string): string {
    try {
      const node = parse(expression);
      const simplified = simplify(node);
      return simplified.toString();
    } catch {
      return expression;
    }
  }

  /**
   * 수식의 복잡도 계산 (접기 깊이 결정에 사용)
   */
  static calculateComplexity(expression: string): number {
    try {
      const node = parse(expression);
      return this.getNodeDepth(node);
    } catch {
      return 1;
    }
  }

  private static getNodeDepth(node: any): number {
    if (!node) return 0;

    if (node.type === 'OperatorNode' || node.type === 'FunctionNode') {
      const childDepths = node.args?.map((arg: any) => this.getNodeDepth(arg)) || [];
      return 1 + Math.max(0, ...childDepths);
    }

    if (node.type === 'ParenthesisNode') {
      return 1 + this.getNodeDepth(node.content);
    }

    return 1;
  }

  /**
   * LaTeX 형식으로 변환
   */
  static toLatex(expression: string): string {
    try {
      const node = parse(expression);
      return node.toTex();
    } catch {
      return expression;
    }
  }
}

/**
 * 미리 정의된 예제 수식들
 */
export const exampleEquations = [
  {
    equation: '3(x + 2) + 2(x + 3)',
    description: '기본 분배 법칙',
    difficulty: 1
  },
  {
    equation: '2(3x + 4) - 3(x - 2)',
    description: '양수와 음수 괄호 전개',
    difficulty: 2
  },
  {
    equation: '4(2x + 3) + 3(x - 1) - 2(x + 5)',
    description: '여러 항의 괄호 전개',
    difficulty: 3
  },
  {
    equation: '(x + 2)(x + 3)',
    description: '이차식 전개 (FOIL)',
    difficulty: 3
  },
  {
    equation: '5(2x + 1) - 3(x - 2) + 4(x + 3)',
    description: '복잡한 다항식 정리',
    difficulty: 4
  }
];
