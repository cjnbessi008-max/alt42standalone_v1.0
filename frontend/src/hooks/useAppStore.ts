import { create } from 'zustand'
import type { Problem, Triangle, AppState, StudentAttempt } from '../types'
import { fetchProblem, submitAttempt } from '../services/api'
import { calculateSimilarity, checkTrianglesOverlap } from '../utils/geometry'

interface AppStore extends AppState {
  setCurrentProblem: (problem: Problem) => void
  setCurrentTriangle: (triangle: Triangle) => void
  setIsScaling: (isScaling: boolean) => void
  setIsDragging: (isDragging: boolean) => void
  startTimer: () => void
  loadProblem: (problemId: string, moodleToken?: string) => Promise<void>
  submitSolution: () => Promise<boolean>
  resetProblem: () => void
  updateTriangleScale: (scaleFactor: number) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentProblem: null,
  currentTriangle: {
    id: 'student-triangle',
    vertices: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 150, y: 200 }
    ],
    color: '#3b82f6',
    isTarget: false,
    scaleFactor: 1
  },
  isScaling: false,
  isDragging: false,
  startTime: null,
  attempts: 0,

  setCurrentProblem: (problem) => set({ currentProblem: problem }),

  setCurrentTriangle: (triangle) => set({ currentTriangle: triangle }),

  setIsScaling: (isScaling) => set({ isScaling }),

  setIsDragging: (isDragging) => set({ isDragging }),

  startTimer: () => set({ startTime: Date.now() }),

  loadProblem: async (problemId: string, moodleToken?: string) => {
    try {
      const problem = await fetchProblem(problemId, moodleToken)
      set({
        currentProblem: problem,
        currentTriangle: { ...problem.sourceTriangle, scaleFactor: 1 },
        attempts: 0,
        startTime: Date.now()
      })
    } catch (error) {
      console.error('Failed to load problem:', error)
    }
  },

  submitSolution: async () => {
    const state = get()
    if (!state.currentProblem || !state.startTime) return false

    const timeSpent = Math.floor((Date.now() - state.startTime) / 1000)
    const similarity = calculateSimilarity(
      state.currentTriangle,
      state.currentProblem.targetTriangle
    )

    const isCorrect = similarity >= (1 - state.currentProblem.tolerance)
    const overlap = checkTrianglesOverlap(
      state.currentTriangle,
      state.currentProblem.targetTriangle
    )

    const attempt: Omit<StudentAttempt, 'id' | 'attemptedAt'> = {
      studentId: 'temp-student', // TODO: Get from session
      problemId: state.currentProblem.id,
      submittedTriangle: state.currentTriangle,
      submittedScaleFactor: state.currentTriangle.scaleFactor || 1,
      isCorrect: isCorrect && overlap > 0.95,
      accuracy: similarity,
      timeSpentSeconds: timeSpent
    }

    try {
      await submitAttempt(attempt)
      set({ attempts: state.attempts + 1 })
      return attempt.isCorrect
    } catch (error) {
      console.error('Failed to submit attempt:', error)
      return false
    }
  },

  resetProblem: () => {
    const state = get()
    if (state.currentProblem) {
      set({
        currentTriangle: { ...state.currentProblem.sourceTriangle, scaleFactor: 1 },
        startTime: Date.now(),
        isScaling: false,
        isDragging: false
      })
    }
  },

  updateTriangleScale: (scaleFactor: number) => {
    const state = get()
    if (!state.currentProblem) return

    const sourceTriangle = state.currentProblem.sourceTriangle
    const centroid = {
      x: (sourceTriangle.vertices[0].x + sourceTriangle.vertices[1].x + sourceTriangle.vertices[2].x) / 3,
      y: (sourceTriangle.vertices[0].y + sourceTriangle.vertices[1].y + sourceTriangle.vertices[2].y) / 3
    }

    const scaledVertices = sourceTriangle.vertices.map(vertex => ({
      x: centroid.x + (vertex.x - centroid.x) * scaleFactor,
      y: centroid.y + (vertex.y - centroid.y) * scaleFactor
    })) as [typeof sourceTriangle.vertices[0], typeof sourceTriangle.vertices[0], typeof sourceTriangle.vertices[0]]

    set({
      currentTriangle: {
        ...state.currentTriangle,
        vertices: scaledVertices,
        scaleFactor
      }
    })
  }
}))
