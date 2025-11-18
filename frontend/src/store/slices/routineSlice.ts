import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoutineType {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  description: string;
  duration: number;
  difficulty: string;
  content: any;
}

interface RoutineRecord {
  id: string;
  userId: string;
  routineTypeId: string;
  completed: boolean;
  rating?: number;
  createdAt: string;
  routineType: RoutineType;
}

interface UserStatistics {
  totalRoutines: number;
  completedRoutines: number;
  totalDuration: number;
  averageRating?: number;
  correctAnswerStreak: number;
}

interface RoutineState {
  routineTypes: RoutineType[];
  currentRoutine: RoutineRecord | null;
  routineHistory: RoutineRecord[];
  statistics: UserStatistics | null;
  isLoading: boolean;
  error: string | null;
  showRoutineModal: boolean;
}

const initialState: RoutineState = {
  routineTypes: [],
  currentRoutine: null,
  routineHistory: [],
  statistics: null,
  isLoading: false,
  error: null,
  showRoutineModal: false,
};

const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    setRoutineTypes: (state, action: PayloadAction<RoutineType[]>) => {
      state.routineTypes = action.payload;
    },
    setCurrentRoutine: (state, action: PayloadAction<RoutineRecord | null>) => {
      state.currentRoutine = action.payload;
    },
    setRoutineHistory: (state, action: PayloadAction<RoutineRecord[]>) => {
      state.routineHistory = action.payload;
    },
    setStatistics: (state, action: PayloadAction<UserStatistics>) => {
      state.statistics = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setShowRoutineModal: (state, action: PayloadAction<boolean>) => {
      state.showRoutineModal = action.payload;
    },
    completeCurrentRoutine: (state) => {
      if (state.currentRoutine) {
        state.currentRoutine.completed = true;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setRoutineTypes,
  setCurrentRoutine,
  setRoutineHistory,
  setStatistics,
  setLoading,
  setError,
  setShowRoutineModal,
  completeCurrentRoutine,
  clearError,
} = routineSlice.actions;

export default routineSlice.reducer;
