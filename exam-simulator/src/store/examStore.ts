import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ExamSession,
  Question,
  MentalEvent,
} from '../types';
import {
  QuestionStatus,
  Difficulty,
  RoundNumber,
} from '../types';

interface ExamStore {
  // 현재 세션
  currentSession: ExamSession | null;

  // 멘탈 이벤트
  mentalEvents: MentalEvent[];

  // 과거 세션들
  pastSessions: ExamSession[];

  // Actions
  createSession: (
    examName: string,
    totalTimeMinutes: number,
    questionCount: number,
    preTensionLevel?: number
  ) => void;

  startSession: () => void;

  updateCurrentQuestion: (
    status: QuestionStatus,
    difficulty?: Difficulty
  ) => void;

  moveToNextQuestion: () => void;

  moveToPreviousQuestion: () => void;

  goToQuestion: (questionIndex: number) => void;

  advanceToNextRound: () => void;

  completeSession: () => void;

  updateQuestionFinalResult: (
    questionIndex: number,
    result: 'correct' | 'wrong' | 'unsolved',
    actualDifficulty?: Difficulty
  ) => void;

  addMentalEvent: (message: string, triggerType: 'time_threshold' | 'manual') => void;

  clearCurrentSession: () => void;

  getRemainingTime: () => number;

  getCurrentQuestion: () => Question | null;
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      mentalEvents: [],
      pastSessions: [],

      createSession: (examName, totalTimeMinutes, questionCount, preTensionLevel) => {
        const sessionId = `session_${Date.now()}`;
        const now = new Date();

        // 기본 라운드 전략
        const defaultStrategy = {
          round1MaxTimePerQuestion: 60, // 1분
          round2MaxTimePerQuestion: 120, // 2분
          round3MaxTimePerQuestion: 180, // 3분
        };

        // 초기 문항 생성
        const questions: Question[] = Array.from({ length: questionCount }, (_, i) => ({
          questionIndex: i + 1,
          rounds: [],
        }));

        const newSession: ExamSession = {
          sessionId,
          examName,
          examDate: now,
          totalTimeMinutes,
          questionCount,
          strategy: defaultStrategy,
          questions,
          currentRound: RoundNumber.ROUND_1,
          currentQuestionIndex: 0,
          startTime: now,
          preTensionLevel,
          status: 'setup',
        };

        set({ currentSession: newSession, mentalEvents: [] });
      },

      startSession: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            status: 'in_progress',
            startTime: new Date(),
          },
        });
      },

      updateCurrentQuestion: (status, difficulty) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const question = currentSession.questions[currentSession.currentQuestionIndex];
        if (!question) return;

        const now = new Date();
        const currentRound = currentSession.currentRound;

        // 현재 라운드의 기록 찾기 또는 생성
        let roundRecord = question.rounds.find(r => r.roundNumber === currentRound);

        if (!roundRecord) {
          roundRecord = {
            roundNumber: currentRound,
            status,
            difficulty,
            startTime: now,
            timeSpent: 0,
          };
          question.rounds.push(roundRecord);
        } else {
          roundRecord.status = status;
          if (difficulty !== undefined) {
            roundRecord.difficulty = difficulty;
          }
          roundRecord.endTime = now;
          roundRecord.timeSpent = Math.floor(
            (now.getTime() - roundRecord.startTime.getTime()) / 1000
          );
        }

        const updatedQuestions = [...currentSession.questions];
        updatedQuestions[currentSession.currentQuestionIndex] = question;

        set({
          currentSession: {
            ...currentSession,
            questions: updatedQuestions,
          },
        });
      },

      moveToNextQuestion: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const nextIndex = currentSession.currentQuestionIndex + 1;
        if (nextIndex < currentSession.questionCount) {
          set({
            currentSession: {
              ...currentSession,
              currentQuestionIndex: nextIndex,
            },
          });
        }
      },

      moveToPreviousQuestion: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const prevIndex = currentSession.currentQuestionIndex - 1;
        if (prevIndex >= 0) {
          set({
            currentSession: {
              ...currentSession,
              currentQuestionIndex: prevIndex,
            },
          });
        }
      },

      goToQuestion: (questionIndex) => {
        const { currentSession } = get();
        if (!currentSession) return;

        if (questionIndex >= 0 && questionIndex < currentSession.questionCount) {
          set({
            currentSession: {
              ...currentSession,
              currentQuestionIndex: questionIndex,
            },
          });
        }
      },

      advanceToNextRound: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        let nextRound: RoundNumber;
        if (currentSession.currentRound === RoundNumber.ROUND_1) {
          nextRound = RoundNumber.ROUND_2;
        } else if (currentSession.currentRound === RoundNumber.ROUND_2) {
          nextRound = RoundNumber.ROUND_3;
        } else {
          return; // 이미 마지막 라운드
        }

        set({
          currentSession: {
            ...currentSession,
            currentRound: nextRound,
            currentQuestionIndex: 0, // 새 라운드 시작 시 첫 문제로
          },
        });
      },

      completeSession: () => {
        const { currentSession, pastSessions } = get();
        if (!currentSession) return;

        const completedSession: ExamSession = {
          ...currentSession,
          status: 'completed',
          endTime: new Date(),
        };

        set({
          currentSession: completedSession,
          pastSessions: [...pastSessions, completedSession],
        });
      },

      updateQuestionFinalResult: (questionIndex, result, actualDifficulty) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const question = currentSession.questions[questionIndex];
        if (!question) return;

        question.finalResult = result;
        if (actualDifficulty !== undefined) {
          question.actualDifficulty = actualDifficulty;
        }

        const updatedQuestions = [...currentSession.questions];
        updatedQuestions[questionIndex] = question;

        set({
          currentSession: {
            ...currentSession,
            questions: updatedQuestions,
          },
        });
      },

      addMentalEvent: (message, triggerType) => {
        const { currentSession, mentalEvents } = get();
        if (!currentSession) return;

        const event: MentalEvent = {
          id: `event_${Date.now()}`,
          sessionId: currentSession.sessionId,
          timestamp: new Date(),
          triggerType,
          message,
          remainingTimePercent: (get().getRemainingTime() / (currentSession.totalTimeMinutes * 60)) * 100,
        };

        set({ mentalEvents: [...mentalEvents, event] });
      },

      clearCurrentSession: () => {
        set({ currentSession: null, mentalEvents: [] });
      },

      getRemainingTime: () => {
        const { currentSession } = get();
        if (!currentSession) return 0;

        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        const total = currentSession.totalTimeMinutes * 60;
        return Math.max(0, total - elapsed);
      },

      getCurrentQuestion: () => {
        const { currentSession } = get();
        if (!currentSession) return null;
        return currentSession.questions[currentSession.currentQuestionIndex] || null;
      },
    }),
    {
      name: 'exam-storage',
    }
  )
);
