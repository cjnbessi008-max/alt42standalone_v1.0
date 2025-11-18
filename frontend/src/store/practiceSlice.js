import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { practiceAPI, progressAPI } from '../services/api';

/**
 * Async thunks for practice actions
 */

export const fetchNextProblem = createAsyncThunk(
  'practice/fetchNextProblem',
  async (moduleId) => {
    const response = await practiceAPI.getNextProblem(moduleId);
    return response.data;
  }
);

export const submitAnswer = createAsyncThunk(
  'practice/submitAnswer',
  async ({ moduleId, data }) => {
    const response = await practiceAPI.submitAnswer(moduleId, data);
    return response.data;
  }
);

export const fetchPracticeSuggestion = createAsyncThunk(
  'practice/fetchPracticeSuggestion',
  async (moduleId) => {
    const response = await practiceAPI.getPracticeSuggestion(moduleId);
    return response.data;
  }
);

export const startPracticeMore = createAsyncThunk(
  'practice/startPracticeMore',
  async (moduleId) => {
    const response = await practiceAPI.startPracticeMore(moduleId);
    return response.data;
  }
);

export const requestHint = createAsyncThunk(
  'practice/requestHint',
  async ({ moduleId, data }) => {
    const response = await practiceAPI.requestHint(moduleId, data);
    return response.data;
  }
);

export const fetchProgress = createAsyncThunk(
  'practice/fetchProgress',
  async (moduleId) => {
    const response = await progressAPI.getProgress(moduleId);
    return response.data;
  }
);

/**
 * Practice slice
 */
const practiceSlice = createSlice({
  name: 'practice',
  initialState: {
    currentModule: null,
    currentProblem: null,
    currentProgress: null,
    feedbackMessage: null,
    practiceSuggestion: null,
    showPracticeMoreModal: false,
    loading: false,
    error: null,
    hintsUsed: 0,
    currentAnswer: null,
  },
  reducers: {
    setCurrentModule: (state, action) => {
      state.currentModule = action.payload;
    },
    setCurrentAnswer: (state, action) => {
      state.currentAnswer = action.payload;
    },
    clearFeedback: (state) => {
      state.feedbackMessage = null;
    },
    showPracticeModal: (state) => {
      state.showPracticeMoreModal = true;
    },
    hidePracticeModal: (state) => {
      state.showPracticeMoreModal = false;
    },
    resetHints: (state) => {
      state.hintsUsed = 0;
    },
    incrementHints: (state) => {
      state.hintsUsed += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch next problem
      .addCase(fetchNextProblem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextProblem.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProblem = action.payload.problem;
        state.currentProgress = action.payload.studentProgress;
        state.hintsUsed = 0;
        state.currentAnswer = null;
      })
      .addCase(fetchNextProblem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackMessage = {
          isCorrect: action.payload.is_correct,
          message: action.payload.feedback,
          explanation: action.payload.explanation,
          hint: action.payload.hint,
          nextAction: action.payload.next_action,
        };
        state.currentProgress = action.payload.progress;

        // Show practice more modal if suggested
        if (action.payload.next_action === 'suggest_practice_more') {
          state.showPracticeMoreModal = true;
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch practice suggestion
      .addCase(fetchPracticeSuggestion.fulfilled, (state, action) => {
        state.practiceSuggestion = action.payload;
      })

      // Start practice more
      .addCase(startPracticeMore.fulfilled, (state, action) => {
        state.currentProblem = action.payload.problem;
        state.showPracticeMoreModal = false;
        state.hintsUsed = 0;
        state.currentAnswer = null;
      })

      // Request hint
      .addCase(requestHint.fulfilled, (state, action) => {
        state.feedbackMessage = {
          ...state.feedbackMessage,
          hint: action.payload.hint,
        };
      })

      // Fetch progress
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.currentProgress = action.payload.progress;
      });
  },
});

export const {
  setCurrentModule,
  setCurrentAnswer,
  clearFeedback,
  showPracticeModal,
  hidePracticeModal,
  resetHints,
  incrementHints,
} = practiceSlice.actions;

export default practiceSlice.reducer;
