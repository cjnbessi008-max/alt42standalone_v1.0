import { RecurrenceProblem, RecurrenceNode, RecurrenceTree } from '../types/recurrence';

let nodeIdCounter = 0;

function createNode(value: number, depth: number, position: number): RecurrenceNode {
  return {
    id: `node-${nodeIdCounter++}`,
    value,
    depth,
    position,
    children: []
  };
}

function buildFibonacciTree(n: number, depth = 0, position = 0, memo: Map<number, number> = new Map()): RecurrenceNode {
  const node = createNode(n, depth, position);

  if (n <= 1) {
    node.result = n;
    return node;
  }

  if (memo.has(n)) {
    node.result = memo.get(n);
    return node;
  }

  const leftChild = buildFibonacciTree(n - 1, depth + 1, position * 2, memo);
  const rightChild = buildFibonacciTree(n - 2, depth + 1, position * 2 + 1, memo);

  node.children = [leftChild, rightChild];
  node.result = leftChild.result! + rightChild.result!;
  memo.set(n, node.result);

  return node;
}

function buildFactorialTree(n: number, depth = 0, position = 0): RecurrenceNode {
  const node = createNode(n, depth, position);

  if (n <= 1) {
    node.result = 1;
    return node;
  }

  const child = buildFactorialTree(n - 1, depth + 1, position);
  node.children = [child];
  node.result = n * child.result!;

  return node;
}

function buildSumTree(n: number, depth = 0, position = 0): RecurrenceNode {
  const node = createNode(n, depth, position);

  if (n === 0) {
    node.result = 0;
    return node;
  }

  const child = buildSumTree(n - 1, depth + 1, position);
  node.children = [child];
  node.result = n + child.result!;

  return node;
}

function buildPowerTree(base: number, exp: number, depth = 0, position = 0): RecurrenceNode {
  const node = createNode(exp, depth, position);

  if (exp === 0) {
    node.result = 1;
    return node;
  }

  if (exp === 1) {
    node.result = base;
    return node;
  }

  const child = buildPowerTree(base, exp - 1, depth + 1, position);
  node.children = [child];
  node.result = base * child.result!;

  return node;
}

function getTreeDepth(node: RecurrenceNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...node.children.map(child => getTreeDepth(child)));
}

function countNodes(node: RecurrenceNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

export const recurrenceProblems: RecurrenceProblem[] = [
  {
    id: 'fibonacci',
    name: '피보나치 수열',
    description: '각 항이 앞의 두 항의 합인 수열',
    formula: 'F(n) = F(n-1) + F(n-2)',
    baseCase: 'F(0) = 0, F(1) = 1',
    example: 'F(5) = 5 → 0, 1, 1, 2, 3, 5',
    calculate: (n: number): RecurrenceTree => {
      nodeIdCounter = 0;
      const root = buildFibonacciTree(Math.min(n, 10)); // Limit depth
      return {
        root,
        maxDepth: getTreeDepth(root),
        totalNodes: countNodes(root)
      };
    }
  },
  {
    id: 'factorial',
    name: '팩토리얼',
    description: 'n부터 1까지의 모든 양의 정수의 곱',
    formula: 'n! = n × (n-1)!',
    baseCase: '0! = 1, 1! = 1',
    example: '5! = 120 → 5×4×3×2×1',
    calculate: (n: number): RecurrenceTree => {
      nodeIdCounter = 0;
      const root = buildFactorialTree(Math.min(n, 8)); // Limit depth
      return {
        root,
        maxDepth: getTreeDepth(root),
        totalNodes: countNodes(root)
      };
    }
  },
  {
    id: 'sum',
    name: '합 계산',
    description: '1부터 n까지의 합',
    formula: 'Sum(n) = n + Sum(n-1)',
    baseCase: 'Sum(0) = 0',
    example: 'Sum(5) = 15 → 5+4+3+2+1',
    calculate: (n: number): RecurrenceTree => {
      nodeIdCounter = 0;
      const root = buildSumTree(Math.min(n, 10));
      return {
        root,
        maxDepth: getTreeDepth(root),
        totalNodes: countNodes(root)
      };
    }
  },
  {
    id: 'power',
    name: '거듭제곱',
    description: '2의 n제곱 계산',
    formula: '2^n = 2 × 2^(n-1)',
    baseCase: '2^0 = 1, 2^1 = 2',
    example: '2^5 = 32',
    calculate: (n: number): RecurrenceTree => {
      nodeIdCounter = 0;
      const root = buildPowerTree(2, Math.min(n, 10));
      return {
        root,
        maxDepth: getTreeDepth(root),
        totalNodes: countNodes(root)
      };
    }
  }
];
