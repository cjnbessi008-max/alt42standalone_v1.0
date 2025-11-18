import { parse, simplify } from 'mathjs'

/**
 * 방정식을 파싱하여 React Flow 그래프로 변환
 * @param {Object} equation - 방정식 객체 { expression, type, title }
 * @returns {Object} - { nodes, edges } React Flow 형식
 */
export function parseEquationToGraph(equation) {
  if (!equation || !equation.expression) {
    return { nodes: [], edges: [] }
  }

  try {
    const { expression, type } = equation

    // 방정식을 양변으로 분리
    const sides = expression.split('=').map(s => s.trim())

    if (sides.length !== 2) {
      // 단순 식인 경우
      return parseSingleExpression(sides[0], type)
    }

    // 양변이 있는 방정식
    return parseEquation(sides[0], sides[1], type)
  } catch (error) {
    console.error('방정식 파싱 오류:', error)
    return createErrorGraph(equation.expression)
  }
}

/**
 * 양변이 있는 방정식 파싱
 */
function parseEquation(leftSide, rightSide, type) {
  const nodes = []
  const edges = []
  let nodeId = 0

  // 루트 노드 (방정식)
  const rootId = `node-${nodeId++}`
  nodes.push({
    id: rootId,
    type: 'default',
    data: { label: '방정식' },
    position: { x: 150, y: 50 },
    style: { background: '#667eea', color: 'white' },
  })

  // 좌변 파싱
  const leftNodes = parseExpression(leftSide, nodeId, 100, 150, 'left')
  const leftRootId = leftNodes.nodes[0]?.id

  if (leftRootId) {
    edges.push({
      id: `edge-${rootId}-${leftRootId}`,
      source: rootId,
      target: leftRootId,
      label: '좌변',
      animated: true,
    })
  }

  nodes.push(...leftNodes.nodes)
  edges.push(...leftNodes.edges)
  nodeId = leftNodes.nextId

  // 우변 파싱
  const rightNodes = parseExpression(rightSide, nodeId, 300, 150, 'right')
  const rightRootId = rightNodes.nodes[0]?.id

  if (rightRootId) {
    edges.push({
      id: `edge-${rootId}-${rightRootId}`,
      source: rootId,
      target: rightRootId,
      label: '우변',
      animated: true,
    })
  }

  nodes.push(...rightNodes.nodes)
  edges.push(...rightNodes.edges)

  return { nodes, edges }
}

/**
 * 단일 식 파싱
 */
function parseSingleExpression(expression, type) {
  const nodes = []
  const edges = []

  const result = parseExpression(expression, 0, 150, 50, 'single')

  return {
    nodes: result.nodes,
    edges: result.edges
  }
}

/**
 * 수식을 파싱하여 항, 인수, 변수, 상수로 분해
 */
function parseExpression(expr, startId, startX, startY, side) {
  const nodes = []
  const edges = []
  let nodeId = startId

  try {
    // mathjs로 파싱
    const parsed = parse(expr)

    // 식의 루트 노드
    const exprId = `node-${nodeId++}`
    nodes.push({
      id: exprId,
      type: 'default',
      data: { label: expr },
      position: { x: startX, y: startY },
      style: { background: '#48bb78', color: 'white' },
    })

    // 항으로 분해 (더하기/빼기 기준)
    const terms = extractTerms(expr)

    terms.forEach((term, index) => {
      const termId = `node-${nodeId++}`
      const termY = startY + 100
      const termX = startX - 60 + (index * 60)

      nodes.push({
        id: termId,
        type: 'default',
        data: { label: term },
        position: { x: termX, y: termY },
        style: { background: '#ed8936', color: 'white' },
      })

      edges.push({
        id: `edge-${exprId}-${termId}`,
        source: exprId,
        target: termId,
        label: `항${index + 1}`,
      })

      // 각 항의 인수 분해
      const factors = extractFactors(term)
      factors.forEach((factor, fIndex) => {
        const factorId = `node-${nodeId++}`
        const factorY = termY + 80
        const factorX = termX - 30 + (fIndex * 60)

        const isVariable = /[a-zA-Z]/.test(factor)
        const isConstant = /^-?\d+(\.\d+)?$/.test(factor)

        let bgColor = '#718096'
        let label = '인수'

        if (isVariable) {
          bgColor = '#4299e1'
          label = '변수'
        } else if (isConstant) {
          bgColor = '#9f7aea'
          label = '상수'
        }

        nodes.push({
          id: factorId,
          type: 'default',
          data: { label: factor },
          position: { x: factorX, y: factorY },
          style: { background: bgColor, color: 'white', fontSize: '12px' },
        })

        edges.push({
          id: `edge-${termId}-${factorId}`,
          source: termId,
          target: factorId,
          label: label,
        })
      })
    })

    return { nodes, edges, nextId: nodeId }
  } catch (error) {
    console.error('식 파싱 오류:', error)
    return { nodes, edges, nextId: nodeId }
  }
}

/**
 * 식에서 항 추출 (덧셈/뺄셈 기준)
 */
function extractTerms(expr) {
  // 간단한 정규식 기반 항 추출
  const terms = []
  let current = ''
  let depth = 0

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]

    if (char === '(') depth++
    if (char === ')') depth--

    if ((char === '+' || char === '-') && depth === 0 && i > 0) {
      if (current.trim()) terms.push(current.trim())
      current = char === '-' ? '-' : ''
    } else {
      current += char
    }
  }

  if (current.trim()) terms.push(current.trim())

  return terms.length > 0 ? terms : [expr]
}

/**
 * 항에서 인수 추출 (곱셈 기준)
 */
function extractFactors(term) {
  // 공백 제거
  term = term.replace(/\s/g, '')

  // 계수와 변수 분리
  const match = term.match(/^(-?\d*\.?\d*)([a-zA-Z]*)(.*)/)

  if (!match) return [term]

  const factors = []
  const [, coef, variable, rest] = match

  // 계수
  if (coef && coef !== '' && coef !== '1' && coef !== '-1') {
    factors.push(coef)
  } else if (coef === '-1' && !variable) {
    factors.push('-1')
  }

  // 변수
  if (variable) {
    // x^2 같은 거듭제곱 처리
    if (rest && rest.startsWith('^')) {
      factors.push(variable + rest)
    } else {
      factors.push(variable)
    }
  }

  // 나머지
  if (rest && !rest.startsWith('^')) {
    factors.push(rest)
  }

  return factors.length > 0 ? factors : [term]
}

/**
 * 오류 발생 시 표시할 그래프
 */
function createErrorGraph(expression) {
  return {
    nodes: [
      {
        id: 'error-node',
        type: 'default',
        data: { label: `파싱 오류\n${expression}` },
        position: { x: 100, y: 100 },
        style: { background: '#e74c3c', color: 'white' },
      }
    ],
    edges: []
  }
}

/**
 * 방정식 타입별 특수 처리
 */
export function getEquationType(expression) {
  // 이차방정식
  if (/x\^2|x²/.test(expression)) {
    return 'quadratic'
  }

  // 일차방정식
  if (/[a-zA-Z]/.test(expression) && !/x\^|x²/.test(expression)) {
    return 'linear'
  }

  // 산술식
  if (!/[a-zA-Z]/.test(expression)) {
    return 'arithmetic'
  }

  return 'unknown'
}
