// Branch 타입 정의
export interface Branch {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  angle: number
  length: number
  depth: number
  children: Branch[]
}

// Tree 구조 타입
export interface TreeStructure {
  root: Branch
  totalBranches: number
  maxDepth: number
}

// 애니메이션 설정
export interface AnimationConfig {
  revealSpeed: 'slow' | 'medium' | 'fast'
  revealPattern: 'sequential' | 'random' | 'all'
  interactionStyle: 'count' | 'identify' | 'label'
  difficultyLevel: 1 | 2 | 3 | 4 | 5
}

// 학생 답변
export interface StudentAnswer {
  count: number
  timestamp: number
  isCorrect: boolean
}

// 피드백 타입
export interface Feedback {
  type: 'success' | 'error' | 'hint'
  message: string
}
