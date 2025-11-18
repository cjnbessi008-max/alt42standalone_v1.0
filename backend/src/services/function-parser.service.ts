import * as math from 'mathjs';

/**
 * Function Tree Node Interface
 * 함수 트리의 개별 노드를 나타냅니다
 */
export interface TreeNode {
  id: string;
  type: 'operator' | 'function' | 'variable' | 'constant' | 'symbol';
  value: string;
  children: TreeNode[];
  depth: number;
  position: number;
  latex?: string;
  description?: string;
}

/**
 * Function Tree Interface
 * 전체 함수 트리 구조를 나타냅니다
 */
export interface FunctionTree {
  expression: string;
  root: TreeNode;
  nodeCount: number;
  maxDepth: number;
  variables: string[];
}

/**
 * FunctionParserService
 * 수학 함수식을 파싱하여 트리 구조로 변환하는 서비스
 */
export class FunctionParserService {
  private nodeIdCounter: number = 0;

  /**
   * 수식을 파싱하여 트리 구조로 변환
   * @param expression 수식 문자열 (예: "sin(2*x + 3)")
   * @returns FunctionTree 객체
   */
  public parse(expression: string): FunctionTree {
    this.nodeIdCounter = 0;

    try {
      // mathjs를 사용하여 수식 파싱
      const node = math.parse(expression);

      // AST를 우리의 트리 구조로 변환
      const root = this.convertToTreeNode(node, 0, 0);

      // 트리 통계 계산
      const nodeCount = this.countNodes(root);
      const maxDepth = this.calculateMaxDepth(root);
      const variables = this.extractVariables(root);

      return {
        expression,
        root,
        nodeCount,
        maxDepth,
        variables,
      };
    } catch (error) {
      throw new Error(`Failed to parse expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * mathjs AST 노드를 우리의 TreeNode로 변환
   */
  private convertToTreeNode(
    node: math.MathNode,
    depth: number,
    position: number
  ): TreeNode {
    const id = `node_${this.nodeIdCounter++}`;

    // 노드 타입에 따라 처리
    if (node.type === 'OperatorNode') {
      const opNode = node as math.OperatorNode;
      return {
        id,
        type: 'operator',
        value: opNode.op,
        children: opNode.args.map((arg, idx) =>
          this.convertToTreeNode(arg, depth + 1, idx)
        ),
        depth,
        position,
        latex: this.getLatexRepresentation(node),
        description: this.getOperatorDescription(opNode.op),
      };
    }

    if (node.type === 'FunctionNode') {
      const funcNode = node as math.FunctionNode;
      return {
        id,
        type: 'function',
        value: funcNode.fn.toString(),
        children: funcNode.args.map((arg, idx) =>
          this.convertToTreeNode(arg, depth + 1, idx)
        ),
        depth,
        position,
        latex: this.getLatexRepresentation(node),
        description: this.getFunctionDescription(funcNode.fn.toString()),
      };
    }

    if (node.type === 'SymbolNode') {
      const symNode = node as math.SymbolNode;
      return {
        id,
        type: 'variable',
        value: symNode.name,
        children: [],
        depth,
        position,
        latex: symNode.name,
        description: `변수: ${symNode.name}`,
      };
    }

    if (node.type === 'ConstantNode') {
      const constNode = node as math.ConstantNode;
      return {
        id,
        type: 'constant',
        value: constNode.value.toString(),
        children: [],
        depth,
        position,
        latex: constNode.value.toString(),
        description: `상수: ${constNode.value}`,
      };
    }

    if (node.type === 'ParenthesisNode') {
      const parenNode = node as math.ParenthesisNode;
      return this.convertToTreeNode(parenNode.content, depth, position);
    }

    // 기타 노드 타입
    return {
      id,
      type: 'symbol',
      value: node.toString(),
      children: [],
      depth,
      position,
      latex: node.toString(),
      description: 'Unknown node type',
    };
  }

  /**
   * LaTeX 표현 생성
   */
  private getLatexRepresentation(node: math.MathNode): string {
    try {
      return node.toTex();
    } catch {
      return node.toString();
    }
  }

  /**
   * 연산자 설명 반환
   */
  private getOperatorDescription(op: string): string {
    const descriptions: Record<string, string> = {
      '+': '덧셈',
      '-': '뺄셈',
      '*': '곱셈',
      '/': '나눗셈',
      '^': '거듭제곱',
      '%': '나머지',
    };
    return descriptions[op] || `연산자: ${op}`;
  }

  /**
   * 함수 설명 반환
   */
  private getFunctionDescription(func: string): string {
    const descriptions: Record<string, string> = {
      'sin': '사인 함수',
      'cos': '코사인 함수',
      'tan': '탄젠트 함수',
      'sqrt': '제곱근 함수',
      'log': '로그 함수',
      'ln': '자연로그 함수',
      'exp': '지수 함수',
      'abs': '절댓값 함수',
      'pow': '거듭제곱 함수',
      'max': '최댓값 함수',
      'min': '최솟값 함수',
    };
    return descriptions[func] || `함수: ${func}`;
  }

  /**
   * 트리의 총 노드 개수 계산
   */
  private countNodes(node: TreeNode): number {
    return 1 + node.children.reduce((sum, child) => sum + this.countNodes(child), 0);
  }

  /**
   * 트리의 최대 깊이 계산
   */
  private calculateMaxDepth(node: TreeNode): number {
    if (node.children.length === 0) {
      return node.depth;
    }
    return Math.max(...node.children.map(child => this.calculateMaxDepth(child)));
  }

  /**
   * 트리에서 사용된 변수 추출
   */
  private extractVariables(node: TreeNode): string[] {
    const variables = new Set<string>();

    const traverse = (n: TreeNode) => {
      if (n.type === 'variable') {
        variables.add(n.value);
      }
      n.children.forEach(child => traverse(child));
    };

    traverse(node);
    return Array.from(variables);
  }

  /**
   * 트리를 JSON 형식으로 변환 (D3.js에서 사용하기 좋은 형식)
   */
  public toD3Format(tree: FunctionTree): any {
    const convertNode = (node: TreeNode): any => {
      return {
        name: node.value,
        type: node.type,
        description: node.description,
        latex: node.latex,
        children: node.children.map(child => convertNode(child)),
      };
    };

    return {
      name: tree.expression,
      ...convertNode(tree.root),
    };
  }
}

export default new FunctionParserService();
