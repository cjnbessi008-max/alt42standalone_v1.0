import { create } from 'zustand';
import { Question, UserAnswer, QuizSession } from '../types';
import { sampleQuestions } from '../data/sampleQuestions';

interface QuizState {
  session: QuizSession | null;
  currentQuestion: Question | null;
  questionStartTime: number;
  isAnswered: boolean;
  showExplanation: boolean;

  // Actions
  startQuiz: (questions?: Question[]) => void;
  submitAnswer: (answer: string | number, usedFocusReset: boolean) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
  setShowExplanation: (show: boolean) => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  currentQuestion: null,
  questionStartTime: 0,
  isAnswered: false,
  showExplanation: false,

  startQuiz: (questions = sampleQuestions) => {
    const sessionId = `session-${Date.now()}`;
    const session: QuizSession = {
      id: sessionId,
      startTime: Date.now(),
      questions: [...questions],
      currentQuestionIndex: 0,
      answers: [],
      score: 0,
      totalQuestions: questions.length
    };

    set({
      session,
      currentQuestion: questions[0],
      questionStartTime: Date.now(),
      isAnswered: false,
      showExplanation: false
    });
  },

  submitAnswer: (answer: string | number, usedFocusReset: boolean) => {
    const { session, currentQuestion, questionStartTime } = get();
    if (!session || !currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = answer === currentQuestion.correctAnswer;

    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent,
      timestamp: Date.now(),
      usedFocusReset
    };

    const updatedAnswers = [...session.answers, userAnswer];
    const updatedScore = isCorrect ? session.score + 1 : session.score;

    set({
      session: {
        ...session,
        answers: updatedAnswers,
        score: updatedScore
      },
      isAnswered: true,
      showExplanation: true
    });
  },

  nextQuestion: () => {
    const { session } = get();
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex < session.questions.length) {
      set({
        session: {
          ...session,
          currentQuestionIndex: nextIndex
        },
        currentQuestion: session.questions[nextIndex],
        questionStartTime: Date.now(),
        isAnswered: false,
        showExplanation: false
      });
    } else {
      // 퀴즈 종료
      get().endQuiz();
    }
  },

  previousQuestion: () => {
    const { session } = get();
    if (!session) return;

    const prevIndex = session.currentQuestionIndex - 1;

    if (prevIndex >= 0) {
      set({
        session: {
          ...session,
          currentQuestionIndex: prevIndex
        },
        currentQuestion: session.questions[prevIndex],
        questionStartTime: Date.now(),
        isAnswered: false,
        showExplanation: false
      });
    }
  },

  endQuiz: () => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        endTime: Date.now()
      }
    });
  },

  resetQuiz: () => {
    set({
      session: null,
      currentQuestion: null,
      questionStartTime: 0,
      isAnswered: false,
      showExplanation: false
    });
  },

  setShowExplanation: (show: boolean) => {
    set({ showExplanation: show });
  }
}));
