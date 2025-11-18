import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  moodleUserId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  preferences?: any;
}

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },
    updatePreferences: (state, action: PayloadAction<any>) => {
      if (state.currentUser) {
        state.currentUser.preferences = action.payload;
      }
    },
  },
});

export const { setUser, setLoading, setError, clearUser, updatePreferences } = userSlice.actions;
export default userSlice.reducer;
