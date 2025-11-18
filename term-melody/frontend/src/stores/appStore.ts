/**
 * Zustand 글로벌 상태 관리
 */

import { create } from 'zustand'
import type { MoodleQuestion, QuestionDetail } from '@types/moodle.types'
import type { Melody } from '@types/melody.types'

interface AppState {
  // 문제 관련
  questions: MoodleQuestion[]
  currentQuestion: QuestionDetail | null
  selectedQuestionId: number | null

  // 음악 관련
  currentMelody: Melody | null
  isPlaying: boolean

  // UI 상태
  isPhoneVisible: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setQuestions: (questions: MoodleQuestion[]) => void
  setCurrentQuestion: (question: QuestionDetail | null) => void
  setSelectedQuestionId: (id: number | null) => void
  setCurrentMelody: (melody: Melody | null) => void
  setIsPlaying: (playing: boolean) => void
  setPhoneVisible: (visible: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  questions: [],
  currentQuestion: null,
  selectedQuestionId: null,
  currentMelody: null,
  isPlaying: false,
  isPhoneVisible: true,
  isLoading: false,
  error: null,

  // Actions
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setSelectedQuestionId: (id) => set({ selectedQuestionId: id }),
  setCurrentMelody: (melody) => set({ currentMelody: melody }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPhoneVisible: (visible) => set({ isPhoneVisible: visible }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      questions: [],
      currentQuestion: null,
      selectedQuestionId: null,
      currentMelody: null,
      isPlaying: false,
      error: null,
    }),
}))
