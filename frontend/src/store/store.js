import { configureStore } from '@reduxjs/toolkit';
import practiceReducer from './practiceSlice';

export const store = configureStore({
  reducer: {
    practice: practiceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['practice/submitAnswer/fulfilled'],
      },
    }),
});

export default store;
