import { create } from 'zustand'
import { TreeStructure, AnimationConfig, Feedback } from '../../../utils/types'
import { generateTree } from '../../../utils/treeGenerator'

interface BranchStore {
  // 상태
  tree: TreeStructure | null
  revealedBranchIds: Set<string>
  isAnimating: boolean
  studentAnswer: number | null
  feedback: Feedback | null
  difficulty: 1 | 2 | 3 | 4 | 5

  // 액션
  initializeTree: (difficulty: 1 | 2 | 3 | 4 | 5) => void
  revealBranch: (branchId: string) => void
  revealAllBranches: () => void
  setAnimating: (isAnimating: boolean) => void
  submitAnswer: (answer: number) => void
  resetModule: () => void
  setDifficulty: (difficulty: 1 | 2 | 3 | 4 | 5) => void
}

export const useBranchStore = create<BranchStore>((set, get) => ({
  // 초기 상태
  tree: null,
  revealedBranchIds: new Set(),
  isAnimating: false,
  studentAnswer: null,
  feedback: null,
  difficulty: 1,

  // 트리 초기화
  initializeTree: (difficulty) => {
    const tree = generateTree(difficulty)
    set({
      tree,
      revealedBranchIds: new Set(),
      studentAnswer: null,
      feedback: null,
      difficulty,
    })
  },

  // 가지 하나씩 드러내기
  revealBranch: (branchId) => {
    set((state) => {
      const newRevealed = new Set(state.revealedBranchIds)
      newRevealed.add(branchId)
      return { revealedBranchIds: newRevealed }
    })
  },

  // 모든 가지 드러내기
  revealAllBranches: () => {
    const { tree } = get()
    if (!tree) return

    const allBranchIds = new Set<string>()
    const collectIds = (branch: any) => {
      allBranchIds.add(branch.id)
      branch.children.forEach(collectIds)
    }
    collectIds(tree.root)

    set({ revealedBranchIds: allBranchIds })
  },

  // 애니메이션 상태 설정
  setAnimating: (isAnimating) => {
    set({ isAnimating })
  },

  // 답변 제출 및 검증
  submitAnswer: (answer) => {
    const { tree } = get()
    if (!tree) return

    const isCorrect = answer === tree.totalBranches

    let feedback: Feedback
    if (isCorrect) {
      feedback = {
        type: 'success',
        message: `정답입니다! 총 ${tree.totalBranches}개의 가지가 있습니다!`,
      }
    } else if (answer < tree.totalBranches) {
      feedback = {
        type: 'hint',
        message: `조금 더 찾아보세요! 힌트: ${tree.totalBranches - answer}개가 더 있어요.`,
      }
    } else {
      feedback = {
        type: 'error',
        message: `너무 많이 세었어요. 다시 세어보세요!`,
      }
    }

    set({ studentAnswer: answer, feedback })
  },

  // 모듈 리셋
  resetModule: () => {
    const { difficulty } = get()
    const tree = generateTree(difficulty)
    set({
      tree,
      revealedBranchIds: new Set(),
      studentAnswer: null,
      feedback: null,
      isAnimating: false,
    })
  },

  // 난이도 설정
  setDifficulty: (difficulty) => {
    set({ difficulty })
    get().initializeTree(difficulty)
  },
}))
