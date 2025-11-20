import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameProgress, PlayerStats, Card } from '../types';

interface GameState extends GameProgress {
  // Actions
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  addCard: (card: Card) => void;
  completeScene: (sceneId: string) => void;
  goToNextScene: () => void;
  resetGame: () => void;
}

const initialStats: PlayerStats = {
  creativity: 0,
  intuition: 0,
  persistence: 0,
  logic: 0,
  imagination: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentChapter: 1,
      currentScene: 0,
      completedScenes: [],
      collectedCards: [],
      playerStats: initialStats,

      // Actions
      updatePlayerStats: (stats: Partial<PlayerStats>) => {
        set((state) => ({
          playerStats: {
            ...state.playerStats,
            ...Object.entries(stats).reduce((acc, [key, value]) => {
              acc[key as keyof PlayerStats] =
                (state.playerStats[key as keyof PlayerStats] || 0) + (value || 0);
              return acc;
            }, {} as PlayerStats),
          },
        }));
      },

      addCard: (card: Card) => {
        set((state) => ({
          collectedCards: [...state.collectedCards, card],
        }));
      },

      completeScene: (sceneId: string) => {
        set((state) => ({
          completedScenes: [...state.completedScenes, sceneId],
        }));
      },

      goToNextScene: () => {
        set((state) => ({
          currentScene: state.currentScene + 1,
        }));
      },

      resetGame: () => {
        set({
          currentChapter: 1,
          currentScene: 0,
          completedScenes: [],
          collectedCards: [],
          playerStats: initialStats,
        });
      },
    }),
    {
      name: 'math-history-game-storage',
    }
  )
);
