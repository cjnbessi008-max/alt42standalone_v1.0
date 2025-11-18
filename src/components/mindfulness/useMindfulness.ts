import { useState, useCallback, useEffect } from 'react';

export interface MindfulnessConfig {
  enabled: boolean;
  routineType: 'breathing' | 'stretch' | 'pause';
  duration: number;
  allowSkip: boolean;
  frequency: number;
  showTimer: boolean;
}

export interface UseMindfulnessOptions {
  /** Initial configuration */
  initialConfig?: Partial<MindfulnessConfig>;
  /** Save config to localStorage */
  persistConfig?: boolean;
  /** LocalStorage key for persisting config */
  storageKey?: string;
}

const DEFAULT_CONFIG: MindfulnessConfig = {
  enabled: true,
  routineType: 'breathing',
  duration: 30,
  allowSkip: true,
  frequency: 1,
  showTimer: true,
};

const STORAGE_KEY = 'mindfulness-config';

/**
 * Custom hook for managing mindfulness routine configuration
 * Provides easy way to manage user preferences for mindfulness features
 */
export const useMindfulness = (options: UseMindfulnessOptions = {}) => {
  const {
    initialConfig = {},
    persistConfig = true,
    storageKey = STORAGE_KEY,
  } = options;

  // Load initial config from localStorage if available
  const loadConfig = useCallback((): MindfulnessConfig => {
    if (persistConfig && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_CONFIG, ...parsed, ...initialConfig };
        }
      } catch (error) {
        console.warn('Failed to load mindfulness config from localStorage:', error);
      }
    }
    return { ...DEFAULT_CONFIG, ...initialConfig };
  }, [persistConfig, storageKey, initialConfig]);

  const [config, setConfig] = useState<MindfulnessConfig>(loadConfig);

  // Save config to localStorage when it changes
  useEffect(() => {
    if (persistConfig && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save mindfulness config to localStorage:', error);
      }
    }
  }, [config, persistConfig, storageKey]);

  const updateConfig = useCallback((updates: Partial<MindfulnessConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setRoutineType = useCallback((routineType: 'breathing' | 'stretch' | 'pause') => {
    setConfig(prev => ({ ...prev, routineType }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setConfig(prev => ({ ...prev, duration: Math.max(10, Math.min(120, duration)) }));
  }, []);

  const setFrequency = useCallback((frequency: number) => {
    setConfig(prev => ({ ...prev, frequency: Math.max(1, frequency) }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    updateConfig,
    toggleEnabled,
    setRoutineType,
    setDuration,
    setFrequency,
    resetToDefaults,
  };
};

export default useMindfulness;
