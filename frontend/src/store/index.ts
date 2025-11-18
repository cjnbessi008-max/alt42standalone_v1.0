import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import routineReducer from './slices/routineSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    routine: routineReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
