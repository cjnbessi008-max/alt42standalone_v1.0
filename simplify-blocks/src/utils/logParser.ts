import { LogBlock, SimplificationStep } from '../types';
import { parse, MathNode } from 'mathjs';

/**
 * 로그식을 파싱하고 블록으로 변환
 */
export class LogParser {
  private blockCounter = 0;

  /**
   * 로그식을 블록 구조로 변환
   */
  parseExpression(expression: string): LogBlock {
    try {
      const node = parse(expression);
      return this.nodeToBlock(node, 0);
    } catch (error) {
      console.error('Parse error:', error);
      return {
        id: this.generateId(),
        type: 'log',
        expression,
        level: 0,
        color: '#ff6b6b'
      };
    }
  }

  /**
   * MathNode를 LogBlock으로 변환
   */
  private nodeToBlock(node: MathNode, level: number): LogBlock {
    const id = this.generateId();

    if (node.type === 'FunctionNode' && (node as any).fn?.name === 'log') {
      return {
        id,
        type: 'log',
        expression: node.toString(),
        level,
        color: this.getColorForLevel(level)
      };
    }

    if (node.type === 'OperatorNode') {
      const operator = (node as any).op;

      if (operator === '+') {
        return {
          id,
          type: 'sum',
          expression: node.toString(),
          level,
          children: (node as any).args?.map((arg: MathNode) =>
            this.nodeToBlock(arg, level + 1)
          ),
          color: this.getColorForLevel(level)
        };
      }

      if (operator === '-') {
        return {
          id,
          type: 'difference',
          expression: node.toString(),
          level,
          children: (node as any).args?.map((arg: MathNode) =>
            this.nodeToBlock(arg, level + 1)
          ),
          color: this.getColorForLevel(level)
        };
      }

      if (operator === '*') {
        return {
          id,
          type: 'coefficient',
          expression: node.toString(),
          level,
          children: (node as any).args?.map((arg: MathNode) =>
            this.nodeToBlock(arg, level + 1)
          ),
          color: this.getColorForLevel(level)
        };
      }
    }

    if (node.type === 'PowerNode') {
      return {
        id,
        type: 'power',
        expression: node.toString(),
        level,
        color: this.getColorForLevel(level)
      };
    }

    return {
      id,
      type: 'log',
      expression: node.toString(),
      level,
      color: this.getColorForLevel(level)
    };
  }

  /**
   * 로그식 단순화 단계 생성
   */
  generateSimplificationSteps(expression: string): SimplificationStep[] {
    const steps: SimplificationStep[] = [];
    let current = expression;

    // 예시: log(a*b) -> log(a) + log(b)
    if (current.includes('*') && current.includes('log')) {
      const before = current;
      const after = this.applyProductRule(current);

      if (before !== after) {
        steps.push({
          id: this.generateId(),
          rule: 'product',
          description: '곱셈 법칙: log(a×b) = log(a) + log(b)',
          before,
          after,
          blocks: [this.parseExpression(after)]
        });
        current = after;
      }
    }

    // 예시: log(a/b) -> log(a) - log(b)
    if (current.includes('/') && current.includes('log')) {
      const before = current;
      const after = this.applyQuotientRule(current);

      if (before !== after) {
        steps.push({
          id: this.generateId(),
          rule: 'quotient',
          description: '나눗셈 법칙: log(a÷b) = log(a) - log(b)',
          before,
          after,
          blocks: [this.parseExpression(after)]
        });
        current = after;
      }
    }

    // 예시: log(a^n) -> n*log(a)
    if (current.includes('^') && current.includes('log')) {
      const before = current;
      const after = this.applyPowerRule(current);

      if (before !== after) {
        steps.push({
          id: this.generateId(),
          rule: 'power',
          description: '거듭제곱 법칙: log(a^n) = n×log(a)',
          before,
          after,
          blocks: [this.parseExpression(after)]
        });
        current = after;
      }
    }

    return steps;
  }

  /**
   * 곱셈 법칙 적용: log(a*b) = log(a) + log(b)
   */
  private applyProductRule(expr: string): string {
    // 간단한 패턴 매칭 (실제로는 더 정교한 구현 필요)
    const match = expr.match(/log\(([a-z0-9]+)\s*\*\s*([a-z0-9]+)\)/i);
    if (match) {
      return expr.replace(match[0], `log(${match[1]}) + log(${match[2]})`);
    }
    return expr;
  }

  /**
   * 나눗셈 법칙 적용: log(a/b) = log(a) - log(b)
   */
  private applyQuotientRule(expr: string): string {
    const match = expr.match(/log\(([a-z0-9]+)\s*\/\s*([a-z0-9]+)\)/i);
    if (match) {
      return expr.replace(match[0], `log(${match[1]}) - log(${match[2]})`);
    }
    return expr;
  }

  /**
   * 거듭제곱 법칙 적용: log(a^n) = n*log(a)
   */
  private applyPowerRule(expr: string): string {
    const match = expr.match(/log\(([a-z0-9]+)\s*\^\s*([a-z0-9]+)\)/i);
    if (match) {
      return expr.replace(match[0], `${match[2]} * log(${match[1]})`);
    }
    return expr;
  }

  /**
   * 레벨별 색상 반환
   */
  private getColorForLevel(level: number): string {
    const colors = [
      '#4ECDC4', // Turquoise
      '#FF6B6B', // Red
      '#95E1D3', // Mint
      '#F38181', // Pink
      '#AA96DA', // Purple
      '#FCBAD3', // Light Pink
      '#A8D8EA', // Light Blue
    ];
    return colors[level % colors.length];
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `block-${this.blockCounter++}-${Date.now()}`;
  }
}

/**
 * 샘플 문제 생성
 */
export function generateSampleProblems(): any[] {
  return [
    {
      id: '1',
      expression: 'log(a*b)',
      difficulty: 'easy',
      description: 'log(a×b)를 단순화하세요'
    },
    {
      id: '2',
      expression: 'log(x/y)',
      difficulty: 'easy',
      description: 'log(x÷y)를 단순화하세요'
    },
    {
      id: '3',
      expression: 'log(a^2)',
      difficulty: 'medium',
      description: 'log(a²)를 단순화하세요'
    },
    {
      id: '4',
      expression: 'log(a*b*c)',
      difficulty: 'medium',
      description: 'log(a×b×c)를 단순화하세요'
    },
    {
      id: '5',
      expression: 'log((a*b)/c)',
      difficulty: 'hard',
      description: 'log((a×b)÷c)를 단순화하세요'
    }
  ];
}
