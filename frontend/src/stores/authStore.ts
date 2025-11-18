import { create } from 'zustand';
import type { User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const tokenData = await authAPI.login({ username, password });
      localStorage.setItem('access_token', tokenData.access_token);

      const user = await authAPI.getCurrentUser();

      set({
        user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || '로그인에 실패했습니다',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authAPI.getCurrentUser();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('access_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
