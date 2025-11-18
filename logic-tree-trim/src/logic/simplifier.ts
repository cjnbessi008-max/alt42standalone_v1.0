/**
 * Logic Simplifier
 * 논리식 단순화 알고리즘 구현
 */

import type { LogicNode, SimplificationStep } from '../types/logic';
import { cloneTree } from './parser';

/**
 * 두 노드가 동일한지 비교
 */
function nodesEqual(a: LogicNode, b: LogicNode): boolean {
  if (a.type !== b.type) return false;
  if (a.value !== b.value) return false;

  if (a.children && b.children) {
    if (a.children.length !== b.children.length) return false;
    return a.children.every((child, i) => nodesEqual(child, b.children![i]));
  }

  return !a.children && !b.children;
}

/**
 * 리터럴 값 가져오기
 */
function isTrue(node: LogicNode): boolean {
  return node.type === 'LITERAL' && node.value === true;
}

function isFalse(node: LogicNode): boolean {
  return node.type === 'LITERAL' && node.value === false;
}

/**
 * 단순화 규칙 적용
 */
class Simplifier {
  private steps: SimplificationStep[] = [];
  private stepCounter = 0;

  /**
   * 메인 단순화 함수
   */
  simplify(root: LogicNode): { tree: LogicNode; steps: SimplificationStep[] } {
    this.steps = [];
    this.stepCounter = 0;

    let current = cloneTree(root);
    let changed = true;

    // 단순화가 더 이상 일어나지 않을 때까지 반복
    while (changed) {
      const result = this.applySimplificationRules(current);
      changed = result.changed;
      current = result.tree;
    }

    return {
      tree: current,
      steps: this.steps,
    };
  }

  /**
   * 모든 단순화 규칙을 순차적으로 시도
   */
  private applySimplificationRules(node: LogicNode): { tree: LogicNode; changed: boolean } {
    let current = node;
    let globalChanged = false;

    // 각 규칙을 순서대로 적용
    const rules: Array<(n: LogicNode) => LogicNode | null> = [
      this.applyDoubleNegation.bind(this),
      this.applyIdentity.bind(this),
      this.applyAnnihilation.bind(this),
      this.applyIdempotent.bind(this),
      this.applyComplement.bind(this),
      this.applyDeMorgan.bind(this),
      this.applyAbsorption.bind(this),
    ];

    for (const rule of rules) {
      const result = this.applyRuleRecursive(current, rule);
      if (result.changed) {
        current = result.tree;
        globalChanged = true;
      }
    }

    return { tree: current, changed: globalChanged };
  }

  /**
   * 규칙을 재귀적으로 적용
   */
  private applyRuleRecursive(
    node: LogicNode,
    rule: (n: LogicNode) => LogicNode | null
  ): { tree: LogicNode; changed: boolean } {
    // 자식 노드부터 처리 (bottom-up)
    let current = cloneTree(node);
    let changed = false;

    if (current.children) {
      const newChildren = current.children.map((child) => {
        const result = this.applyRuleRecursive(child, rule);
        if (result.changed) changed = true;
        return result.tree;
      });
      current.children = newChildren;
    }

    // 현재 노드에 규칙 적용
    const simplified = rule(current);
    if (simplified) {
      return { tree: simplified, changed: true };
    }

    return { tree: current, changed };
  }

  /**
   * 규칙 1: 이중 부정 제거 (NOT NOT A = A)
   */
  private applyDoubleNegation(node: LogicNode): LogicNode | null {
    if (node.type === 'NOT' && node.children![0].type === 'NOT') {
      this.addStep('doubleNegation', 'Double Negation Elimination', node, node.children![0].children![0]);
      return node.children![0].children![0];
    }
    return null;
  }

  /**
   * 규칙 2: 항등원 (A AND TRUE = A, A OR FALSE = A)
   */
  private applyIdentity(node: LogicNode): LogicNode | null {
    if (node.type === 'AND' && node.children) {
      // A AND TRUE = A
      const trueIndex = node.children.findIndex(isTrue);
      if (trueIndex !== -1) {
        const remaining = node.children.filter((_, i) => i !== trueIndex);
        if (remaining.length === 1) {
          this.addStep('identity', 'Identity Law (A AND TRUE = A)', node, remaining[0]);
          return remaining[0];
        } else if (remaining.length > 1) {
          const newNode = { ...node, children: remaining };
          this.addStep('identity', 'Identity Law (remove TRUE from AND)', node, newNode);
          return newNode;
        }
      }
    }

    if (node.type === 'OR' && node.children) {
      // A OR FALSE = A
      const falseIndex = node.children.findIndex(isFalse);
      if (falseIndex !== -1) {
        const remaining = node.children.filter((_, i) => i !== falseIndex);
        if (remaining.length === 1) {
          this.addStep('identity', 'Identity Law (A OR FALSE = A)', node, remaining[0]);
          return remaining[0];
        } else if (remaining.length > 1) {
          const newNode = { ...node, children: remaining };
          this.addStep('identity', 'Identity Law (remove FALSE from OR)', node, newNode);
          return newNode;
        }
      }
    }

    return null;
  }

  /**
   * 규칙 3: 영원 (A AND FALSE = FALSE, A OR TRUE = TRUE)
   */
  private applyAnnihilation(node: LogicNode): LogicNode | null {
    if (node.type === 'AND' && node.children?.some(isFalse)) {
      const falseNode: LogicNode = { id: `literal-false-${this.stepCounter}`, type: 'LITERAL', value: false };
      this.addStep('annihilation', 'Annihilation Law (A AND FALSE = FALSE)', node, falseNode);
      return falseNode;
    }

    if (node.type === 'OR' && node.children?.some(isTrue)) {
      const trueNode: LogicNode = { id: `literal-true-${this.stepCounter}`, type: 'LITERAL', value: true };
      this.addStep('annihilation', 'Annihilation Law (A OR TRUE = TRUE)', node, trueNode);
      return trueNode;
    }

    return null;
  }

  /**
   * 규칙 4: 멱등성 (A AND A = A, A OR A = A)
   */
  private applyIdempotent(node: LogicNode): LogicNode | null {
    if ((node.type === 'AND' || node.type === 'OR') && node.children && node.children.length > 1) {
      // 중복 제거
      const unique: LogicNode[] = [];
      for (const child of node.children) {
        if (!unique.some((u) => nodesEqual(u, child))) {
          unique.push(child);
        }
      }

      if (unique.length < node.children.length) {
        if (unique.length === 1) {
          this.addStep('idempotent', `Idempotent Law (A ${node.type} A = A)`, node, unique[0]);
          return unique[0];
        } else {
          const newNode = { ...node, children: unique };
          this.addStep('idempotent', 'Idempotent Law (remove duplicates)', node, newNode);
          return newNode;
        }
      }
    }

    return null;
  }

  /**
   * 규칙 5: 보수 (A AND NOT A = FALSE, A OR NOT A = TRUE)
   */
  private applyComplement(node: LogicNode): LogicNode | null {
    if (node.type === 'AND' && node.children) {
      // A AND NOT A 찾기
      for (let i = 0; i < node.children.length; i++) {
        for (let j = i + 1; j < node.children.length; j++) {
          const a = node.children[i];
          const b = node.children[j];

          if (b.type === 'NOT' && nodesEqual(a, b.children![0])) {
            const falseNode: LogicNode = { id: `literal-false-${this.stepCounter}`, type: 'LITERAL', value: false };
            this.addStep('complement', 'Complement Law (A AND NOT A = FALSE)', node, falseNode);
            return falseNode;
          }
        }
      }
    }

    if (node.type === 'OR' && node.children) {
      // A OR NOT A 찾기
      for (let i = 0; i < node.children.length; i++) {
        for (let j = i + 1; j < node.children.length; j++) {
          const a = node.children[i];
          const b = node.children[j];

          if (b.type === 'NOT' && nodesEqual(a, b.children![0])) {
            const trueNode: LogicNode = { id: `literal-true-${this.stepCounter}`, type: 'LITERAL', value: true };
            this.addStep('complement', 'Complement Law (A OR NOT A = TRUE)', node, trueNode);
            return trueNode;
          }
        }
      }
    }

    return null;
  }

  /**
   * 규칙 6: 드모르간 법칙 (NOT(A AND B) = NOT A OR NOT B)
   */
  private applyDeMorgan(node: LogicNode): LogicNode | null {
    if (node.type === 'NOT' && node.children![0].type === 'AND') {
      const inner = node.children![0];
      const newChildren = inner.children!.map((child) => ({
        id: `not-${child.id}`,
        type: 'NOT' as const,
        children: [child],
      }));

      const newNode: LogicNode = {
        id: `demorgan-or-${this.stepCounter}`,
        type: 'OR',
        children: newChildren,
      };

      this.addStep('demorgan', "De Morgan's Law: NOT(A AND B) = NOT A OR NOT B", node, newNode);
      return newNode;
    }

    if (node.type === 'NOT' && node.children![0].type === 'OR') {
      const inner = node.children![0];
      const newChildren = inner.children!.map((child) => ({
        id: `not-${child.id}`,
        type: 'NOT' as const,
        children: [child],
      }));

      const newNode: LogicNode = {
        id: `demorgan-and-${this.stepCounter}`,
        type: 'AND',
        children: newChildren,
      };

      this.addStep('demorgan', "De Morgan's Law: NOT(A OR B) = NOT A AND NOT B", node, newNode);
      return newNode;
    }

    return null;
  }

  /**
   * 규칙 7: 흡수 법칙 (A OR (A AND B) = A)
   */
  private applyAbsorption(node: LogicNode): LogicNode | null {
    if (node.type === 'OR' && node.children) {
      for (let i = 0; i < node.children.length; i++) {
        for (let j = 0; j < node.children.length; j++) {
          if (i === j) continue;

          const a = node.children[i];
          const b = node.children[j];

          // A OR (A AND something)
          if (b.type === 'AND' && b.children?.some((child) => nodesEqual(child, a))) {
            const remaining = node.children.filter((_, idx) => idx !== j);
            if (remaining.length === 1) {
              this.addStep('absorption', 'Absorption Law (A OR (A AND B) = A)', node, remaining[0]);
              return remaining[0];
            }
          }
        }
      }
    }

    if (node.type === 'AND' && node.children) {
      for (let i = 0; i < node.children.length; i++) {
        for (let j = 0; j < node.children.length; j++) {
          if (i === j) continue;

          const a = node.children[i];
          const b = node.children[j];

          // A AND (A OR something)
          if (b.type === 'OR' && b.children?.some((child) => nodesEqual(child, a))) {
            const remaining = node.children.filter((_, idx) => idx !== j);
            if (remaining.length === 1) {
              this.addStep('absorption', 'Absorption Law (A AND (A OR B) = A)', node, remaining[0]);
              return remaining[0];
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * 단순화 단계 기록
   */
  private addStep(rule: string, description: string, before: LogicNode, after: LogicNode): void {
    this.steps.push({
      stepNumber: this.stepCounter++,
      rule,
      description,
      before: cloneTree(before),
      after: cloneTree(after),
      prunedNodeIds: [before.id],
    });
  }
}

/**
 * 논리 트리 단순화
 */
export function simplifyLogicTree(root: LogicNode): { tree: LogicNode; steps: SimplificationStep[] } {
  const simplifier = new Simplifier();
  return simplifier.simplify(root);
}
