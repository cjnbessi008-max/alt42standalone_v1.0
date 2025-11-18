/**
 * Logic Expression Parser
 * 논리식 문자열을 트리 구조로 파싱
 */

import type { LogicNode } from '../types/logic';

let nodeCounter = 0;

function generateId(): string {
  return `node-${nodeCounter++}`;
}

/**
 * 토큰화
 */
function tokenize(expression: string): string[] {
  // 공백 제거 및 연산자 분리
  const normalized = expression
    .replace(/\s+/g, '')
    .replace(/AND/gi, '&')
    .replace(/OR/gi, '|')
    .replace(/NOT/gi, '!')
    .replace(/\&\&/g, '&')
    .replace(/\|\|/g, '|');

  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '(' || char === ')' || char === '&' || char === '|' || char === '!') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * 재귀 하강 파서 (Recursive Descent Parser)
 */
class Parser {
  private tokens: string[];
  private position: number;

  constructor(tokens: string[]) {
    this.tokens = tokens;
    this.position = 0;
  }

  private peek(): string | undefined {
    return this.tokens[this.position];
  }

  private consume(): string {
    return this.tokens[this.position++];
  }

  private match(expected: string): boolean {
    if (this.peek() === expected) {
      this.consume();
      return true;
    }
    return false;
  }

  // Expression → OrExpression
  parseExpression(): LogicNode {
    return this.parseOrExpression();
  }

  // OrExpression → AndExpression ( '|' AndExpression )*
  private parseOrExpression(): LogicNode {
    let left = this.parseAndExpression();

    while (this.match('|')) {
      const node: LogicNode = {
        id: generateId(),
        type: 'OR',
        children: [left],
      };

      const right = this.parseAndExpression();
      node.children!.push(right);

      left = node;
    }

    return left;
  }

  // AndExpression → NotExpression ( '&' NotExpression )*
  private parseAndExpression(): LogicNode {
    let left = this.parseNotExpression();

    while (this.match('&')) {
      const node: LogicNode = {
        id: generateId(),
        type: 'AND',
        children: [left],
      };

      const right = this.parseNotExpression();
      node.children!.push(right);

      left = node;
    }

    return left;
  }

  // NotExpression → '!' NotExpression | PrimaryExpression
  private parseNotExpression(): LogicNode {
    if (this.match('!')) {
      const node: LogicNode = {
        id: generateId(),
        type: 'NOT',
        children: [this.parseNotExpression()],
      };
      return node;
    }

    return this.parsePrimaryExpression();
  }

  // PrimaryExpression → '(' Expression ')' | Variable | Literal
  private parsePrimaryExpression(): LogicNode {
    // 괄호 처리
    if (this.match('(')) {
      const node = this.parseExpression();
      if (!this.match(')')) {
        throw new Error('Expected closing parenthesis');
      }
      return node;
    }

    // 리터럴 (true/false)
    const token = this.peek();
    if (token === 'true' || token === 'false' || token === 'TRUE' || token === 'FALSE') {
      this.consume();
      return {
        id: generateId(),
        type: 'LITERAL',
        value: token.toLowerCase() === 'true',
      };
    }

    // 변수
    if (token && /^[A-Za-z][A-Za-z0-9]*$/.test(token)) {
      this.consume();
      return {
        id: generateId(),
        type: 'VARIABLE',
        value: token,
      };
    }

    throw new Error(`Unexpected token: ${token}`);
  }
}

/**
 * 논리식 문자열을 파싱하여 트리 구조로 반환
 */
export function parseLogicExpression(expression: string): LogicNode {
  nodeCounter = 0; // 리셋
  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

/**
 * 트리를 문자열 표현식으로 변환
 */
export function treeToString(node: LogicNode): string {
  switch (node.type) {
    case 'VARIABLE':
      return node.value as string;

    case 'LITERAL':
      return String(node.value);

    case 'NOT':
      return `NOT ${treeToString(node.children![0])}`;

    case 'AND':
      return `(${node.children!.map(treeToString).join(' AND ')})`;

    case 'OR':
      return `(${node.children!.map(treeToString).join(' OR ')})`;

    default:
      return '';
  }
}

/**
 * 트리 복사 (deep copy)
 */
export function cloneTree(node: LogicNode): LogicNode {
  return {
    ...node,
    children: node.children?.map(cloneTree),
  };
}
