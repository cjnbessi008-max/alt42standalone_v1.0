import { create } from 'zustand'
import { AnalysisResponse } from '../services/api'

interface ProblemState {
  problemData: AnalysisResponse | null
  setProblemData: (data: AnalysisResponse | null) => void
  clearProblem: () => void
}

export const useProblemStore = create<ProblemState>((set) => ({
  problemData: null,
  setProblemData: (data) => set({ problemData: data }),
  clearProblem: () => set({ problemData: null }),
}))
