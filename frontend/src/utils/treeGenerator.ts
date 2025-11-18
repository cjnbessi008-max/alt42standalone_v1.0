import { Branch, TreeStructure } from './types'

/**
 * 나뭇가지를 재귀적으로 생성하는 함수
 */
function generateBranch(
  id: string,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  depth: number,
  maxDepth: number,
  branchCount: { count: number }
): Branch {
  // 끝점 계산
  const endX = startX + Math.cos(angle) * length
  const endY = startY + Math.sin(angle) * length

  const branch: Branch = {
    id,
    startX,
    startY,
    endX,
    endY,
    angle,
    length,
    depth,
    children: [],
  }

  // 최대 깊이에 도달하면 종료
  if (depth >= maxDepth) {
    return branch
  }

  // 자식 가지 생성 (2-3개)
  const childCount = Math.random() > 0.3 ? 2 : 3
  const angleSpread = Math.PI / 6 // 30도

  for (let i = 0; i < childCount; i++) {
    branchCount.count++
    const childAngle = angle + (angleSpread * (i - (childCount - 1) / 2))
    const childLength = length * (0.6 + Math.random() * 0.2) // 60-80%

    const childBranch = generateBranch(
      `${id}-${i}`,
      endX,
      endY,
      childAngle,
      childLength,
      depth + 1,
      maxDepth,
      branchCount
    )

    branch.children.push(childBranch)
  }

  return branch
}

/**
 * 난이도에 따른 트리 생성
 */
export function generateTree(difficulty: 1 | 2 | 3 | 4 | 5): TreeStructure {
  // 난이도에 따라 깊이 조정
  const maxDepth = difficulty + 1 // 1: 깊이2, 5: 깊이6

  const branchCount = { count: 1 } // 루트 포함

  // 트리 시작점 (화면 하단 중앙)
  const rootX = 200
  const rootY = 350
  const rootLength = 100
  const rootAngle = -Math.PI / 2 // 위쪽

  const root = generateBranch(
    'root',
    rootX,
    rootY,
    rootAngle,
    rootLength,
    0,
    maxDepth,
    branchCount
  )

  return {
    root,
    totalBranches: branchCount.count,
    maxDepth,
  }
}

/**
 * 모든 가지를 평면 배열로 변환 (순회)
 */
export function flattenBranches(branch: Branch): Branch[] {
  const branches: Branch[] = [branch]

  for (const child of branch.children) {
    branches.push(...flattenBranches(child))
  }

  return branches
}

/**
 * 가지 개수 계산
 */
export function countBranches(branch: Branch): number {
  let count = 1

  for (const child of branch.children) {
    count += countBranches(child)
  }

  return count
}
