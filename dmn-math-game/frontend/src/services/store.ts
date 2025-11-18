import { create } from 'zustand';
import { GameSession, Problem, StudentProgress } from './api';

interface GameState {
  studentId: string | null;
  session: GameSession | null;
  currentProblem: Problem | null;
  progress: StudentProgress | null;
  answer: string;
  startTime: number | null;
  showFeedback: boolean;
  feedbackMessage: string;
  isCorrect: boolean;

  setStudentId: (id: string) => void;
  setSession: (session: GameSession) => void;
  setCurrentProblem: (problem: Problem) => void;
  setProgress: (progress: StudentProgress | null) => void;
  setAnswer: (answer: string) => void;
  setStartTime: (time: number) => void;
  setFeedback: (message: string, isCorrect: boolean) => void;
  hideFeedback: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  studentId: null,
  session: null,
  currentProblem: null,
  progress: null,
  answer: '',
  startTime: null,
  showFeedback: false,
  feedbackMessage: '',
  isCorrect: false,

  setStudentId: (id) => set({ studentId: id }),
  setSession: (session) => set({ session }),
  setCurrentProblem: (problem) => set({ currentProblem: problem, startTime: Date.now(), answer: '' }),
  setProgress: (progress) => set({ progress }),
  setAnswer: (answer) => set({ answer }),
  setStartTime: (time) => set({ startTime: time }),
  setFeedback: (message, isCorrect) =>
    set({ feedbackMessage: message, showFeedback: true, isCorrect }),
  hideFeedback: () => set({ showFeedback: false }),
  reset: () =>
    set({
      session: null,
      currentProblem: null,
      answer: '',
      startTime: null,
      showFeedback: false,
      feedbackMessage: '',
      isCorrect: false,
    }),
}));
