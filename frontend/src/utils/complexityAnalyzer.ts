import { ComplexityAnalysis, ComplexitySeverity, ComplexityWarning } from '@/types/rule';

/**
 * Analyzes rule complexity based on multiple criteria
 */
export class RuleComplexityAnalyzer {
  /**
   * Analyze the complexity of a rule's conditions
   */
  static analyze(conditions: string): ComplexityAnalysis {
    const metrics = {
      conditionCount: this.countConditions(conditions),
      nestingDepth: this.calculateNestingDepth(conditions),
      entityCount: this.countEntities(conditions),
      hasCyclicDependency: this.detectCyclicDependencies(conditions),
    };

    const warnings = this.generateWarnings(metrics);
    const score = this.calculateScore(metrics);
    const severity = this.determineSeverity(score, metrics);

    return {
      score,
      severity,
      warnings,
      metrics,
    };
  }

  /**
   * Count the number of conditions (if, else if, &&, ||, etc.)
   */
  private static countConditions(conditions: string): number {
    if (!conditions.trim()) return 0;

    const ifCount = (conditions.match(/\bif\b/gi) || []).length;
    const elseIfCount = (conditions.match(/\belse\s+if\b/gi) || []).length;
    const andCount = (conditions.match(/&&/g) || []).length;
    const orCount = (conditions.match(/\|\|/g) || []).length;
    const ternaryCount = (conditions.match(/\?/g) || []).length;

    return ifCount + elseIfCount + andCount + orCount + ternaryCount;
  }

  /**
   * Calculate the maximum nesting depth of conditions
   */
  private static calculateNestingDepth(conditions: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of conditions) {
      if (char === '{' || char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}' || char === ')') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Count unique entities (variables, fields, objects)
   */
  private static countEntities(conditions: string): number {
    const entityPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\b/g;
    const matches = conditions.match(entityPattern) || [];

    const keywords = new Set([
      'if', 'else', 'for', 'while', 'return', 'true', 'false',
      'null', 'undefined', 'const', 'let', 'var', 'function',
      'and', 'or', 'not', 'in', 'is'
    ]);

    const entities = new Set(
      matches
        .filter(match => !keywords.has(match.toLowerCase()))
        .filter(match => !/^\d+$/.test(match))
    );

    return entities.size;
  }

  /**
   * Detect potential cyclic dependencies
   */
  private static detectCyclicDependencies(conditions: string): boolean {
    // Simple heuristic: look for self-referential patterns
    const selfRefPattern = /(\w+)\s*=.*\1/;
    const recursivePattern = /function\s+(\w+).*\1\s*\(/;

    return selfRefPattern.test(conditions) || recursivePattern.test(conditions);
  }

  /**
   * Generate warnings based on metrics
   */
  private static generateWarnings(metrics: {
    conditionCount: number;
    nestingDepth: number;
    entityCount: number;
    hasCyclicDependency: boolean;
  }): ComplexityWarning[] {
    const warnings: ComplexityWarning[] = [];

    // Check condition count
    if (metrics.conditionCount > 10) {
      warnings.push({
        type: 'conditions',
        severity: 'critical',
        message: `매우 많은 조건 (${metrics.conditionCount}개)이 발견되었습니다.`,
        recommendation: '규칙을 여러 개의 작은 규칙으로 분리하는 것을 고려하세요.',
      });
    } else if (metrics.conditionCount > 5) {
      warnings.push({
        type: 'conditions',
        severity: 'high',
        message: `많은 조건 (${metrics.conditionCount}개)이 포함되어 있습니다.`,
        recommendation: '일부 조건을 별도의 규칙으로 추출하면 이해하기 쉬워집니다.',
      });
    } else if (metrics.conditionCount > 3) {
      warnings.push({
        type: 'conditions',
        severity: 'medium',
        message: `복수의 조건 (${metrics.conditionCount}개)이 있습니다.`,
        recommendation: '조건의 복잡도를 검토해보세요.',
      });
    }

    // Check nesting depth
    if (metrics.nestingDepth > 5) {
      warnings.push({
        type: 'nesting',
        severity: 'critical',
        message: `매우 깊은 중첩 (${metrics.nestingDepth}레벨)이 발견되었습니다.`,
        recommendation: '중첩을 줄이기 위해 조기 반환(early return) 패턴을 사용하세요.',
      });
    } else if (metrics.nestingDepth > 3) {
      warnings.push({
        type: 'nesting',
        severity: 'high',
        message: `깊은 중첩 (${metrics.nestingDepth}레벨)이 있습니다.`,
        recommendation: '중첩 레벨을 줄여서 가독성을 개선하세요.',
      });
    }

    // Check entity count
    if (metrics.entityCount > 6) {
      warnings.push({
        type: 'entities',
        severity: 'high',
        message: `많은 엔티티 (${metrics.entityCount}개)가 참조되고 있습니다.`,
        recommendation: '관련 엔티티를 그룹화하거나 규칙을 분리하세요.',
      });
    } else if (metrics.entityCount > 4) {
      warnings.push({
        type: 'entities',
        severity: 'medium',
        message: `여러 엔티티 (${metrics.entityCount}개)가 관련되어 있습니다.`,
        recommendation: '엔티티 간의 관계를 명확히 문서화하세요.',
      });
    }

    // Check cyclic dependencies
    if (metrics.hasCyclicDependency) {
      warnings.push({
        type: 'cyclic',
        severity: 'critical',
        message: '순환 참조가 감지되었습니다.',
        recommendation: '순환 참조를 제거하여 무한 루프를 방지하세요.',
      });
    }

    return warnings;
  }

  /**
   * Calculate overall complexity score (0-100)
   */
  private static calculateScore(metrics: {
    conditionCount: number;
    nestingDepth: number;
    entityCount: number;
    hasCyclicDependency: boolean;
  }): number {
    let score = 0;

    // Condition count contributes up to 40 points
    score += Math.min(metrics.conditionCount * 3, 40);

    // Nesting depth contributes up to 30 points
    score += Math.min(metrics.nestingDepth * 5, 30);

    // Entity count contributes up to 20 points
    score += Math.min(metrics.entityCount * 3, 20);

    // Cyclic dependency adds 10 points
    if (metrics.hasCyclicDependency) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Determine severity level based on score and metrics
   */
  private static determineSeverity(
    score: number,
    metrics: {
      conditionCount: number;
      nestingDepth: number;
      entityCount: number;
      hasCyclicDependency: boolean;
    }
  ): ComplexitySeverity {
    // Cyclic dependency is always critical
    if (metrics.hasCyclicDependency) {
      return 'critical';
    }

    // Check individual metric thresholds
    if (
      metrics.conditionCount > 10 ||
      metrics.nestingDepth > 5 ||
      metrics.entityCount > 6
    ) {
      return 'critical';
    }

    if (
      metrics.conditionCount > 5 ||
      metrics.nestingDepth > 3 ||
      metrics.entityCount > 4
    ) {
      return 'high';
    }

    // Use score-based severity
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    if (score >= 10) return 'low';
    return 'none';
  }
}
