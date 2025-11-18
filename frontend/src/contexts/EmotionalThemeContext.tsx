/**
 * Emotional Theme Context
 * Provides global state management for emotion-based color mode system
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, Snackbar, Alert } from '@mui/material';
import { io, Socket } from 'socket.io-client';

import { getThemeForMode } from '../themes/colorModeThemes';
import {
  ColorMode,
  EmotionalState,
  ColorModeChangeEvent,
  StudentColorPreferences,
} from '../types/emotion';

// ============================================================================
// Context Types
// ============================================================================

interface EmotionalThemeContextType {
  // Current state
  currentMode: ColorMode;
  emotionalState: EmotionalState | null;
  autoModeEnabled: boolean;
  isConnected: boolean;

  // Actions
  setManualMode: (mode: ColorMode) => void;
  toggleAutoMode: (enabled: boolean) => void;
  updatePreferences: (preferences: Partial<StudentColorPreferences>) => Promise<void>;

  // Student/session info
  studentId: number | null;
  sessionId: string | null;
}

// ============================================================================
// Context Creation
// ============================================================================

const EmotionalThemeContext = createContext<EmotionalThemeContextType | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface EmotionalThemeProviderProps {
  children: ReactNode;
  studentId?: number;
  sessionId?: string;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  initialMode?: ColorMode;
  enableNotifications?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

export const EmotionalThemeProvider: React.FC<EmotionalThemeProviderProps> = ({
  children,
  studentId = null,
  sessionId = null,
  apiBaseUrl = '/api/v1',
  wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
  initialMode = 'neutral',
  enableNotifications = true,
}) => {
  // State
  const [currentMode, setCurrentMode] = useState<ColorMode>(initialMode);
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'info' | 'success' | 'warning'>('info');

  // ============================================================================
  // WebSocket Connection
  // ============================================================================

  useEffect(() => {
    if (!studentId || !sessionId) {
      console.warn('EmotionalThemeProvider: Missing studentId or sessionId, WebSocket disabled');
      return;
    }

    // Initialize WebSocket connection
    const socketConnection = io(wsBaseUrl, {
      path: `/api/v1/emotion/ws/${studentId}/${sessionId}`,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketConnection.on('connect', () => {
      console.log('Emotion detection WebSocket connected');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Emotion detection WebSocket disconnected');
      setIsConnected(false);
    });

    socketConnection.on('color_mode_change', (data: ColorModeChangeEvent['data']) => {
      if (autoModeEnabled && !data.reason.includes('manual')) {
        console.log('Color mode change received:', data);
        setCurrentMode(data.new_mode);
        setEmotionalState(data.emotional_state);

        // Show notification
        if (enableNotifications) {
          showNotification(
            `Switching to ${data.new_mode} mode - ${data.reason}`,
            'info'
          );
        }
      }
    });

    socketConnection.on('emotion_detected', (data: any) => {
      console.log('Emotion detected:', data);
      setEmotionalState(data.detected_emotion);
    });

    socketConnection.on('connected', (data: any) => {
      console.log('Initial state received:', data);
      if (data.color_mode) {
        setCurrentMode(data.color_mode);
      }
      if (data.detected_emotion) {
        setEmotionalState(data.detected_emotion);
      }
    });

    socketConnection.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      showNotification('Connection error with emotion detection service', 'warning');
    });

    setSocket(socketConnection);

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [studentId, sessionId, wsBaseUrl, autoModeEnabled, enableNotifications]);

  // ============================================================================
  // Load Initial Preferences
  // ============================================================================

  useEffect(() => {
    if (!studentId) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/emotion/student/${studentId}/preferences`);
        if (response.ok) {
          const prefs: StudentColorPreferences = await response.json();
          setAutoModeEnabled(prefs.auto_mode_enabled);
          setCurrentMode(prefs.preferred_default_mode);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, [studentId, apiBaseUrl]);

  // ============================================================================
  // Actions
  // ============================================================================

  const setManualMode = useCallback(
    (mode: ColorMode) => {
      setAutoModeEnabled(false);
      setCurrentMode(mode);

      // Send to backend
      if (socket && isConnected) {
        socket.emit('manual_mode_selected', { mode });
      }

      if (enableNotifications) {
        showNotification(`Switched to ${mode} mode manually`, 'success');
      }
    },
    [socket, isConnected, enableNotifications]
  );

  const toggleAutoMode = useCallback(
    (enabled: boolean) => {
      setAutoModeEnabled(enabled);

      // Send to backend
      if (socket && isConnected) {
        socket.emit('auto_mode_toggled', { enabled });
      }

      if (enableNotifications) {
        showNotification(
          enabled ? 'Auto mode enabled' : 'Auto mode disabled',
          'info'
        );
      }
    },
    [socket, isConnected, enableNotifications]
  );

  const updatePreferences = useCallback(
    async (preferences: Partial<StudentColorPreferences>) => {
      if (!studentId) {
        throw new Error('Student ID not set');
      }

      try {
        const response = await fetch(`${apiBaseUrl}/emotion/student/${studentId}/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const result = await response.json();

        // Update local state
        if (preferences.auto_mode_enabled !== undefined) {
          setAutoModeEnabled(preferences.auto_mode_enabled);
        }
        if (preferences.preferred_default_mode) {
          setCurrentMode(preferences.preferred_default_mode);
        }

        if (enableNotifications) {
          showNotification('Preferences updated successfully', 'success');
        }

        return result;
      } catch (error) {
        console.error('Failed to update preferences:', error);
        if (enableNotifications) {
          showNotification('Failed to update preferences', 'warning');
        }
        throw error;
      }
    },
    [studentId, apiBaseUrl, enableNotifications]
  );

  const showNotification = (message: string, severity: 'info' | 'success' | 'warning') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setNotificationOpen(true);
  };

  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: EmotionalThemeContextType = {
    currentMode,
    emotionalState,
    autoModeEnabled,
    isConnected,
    setManualMode,
    toggleAutoMode,
    updatePreferences,
    studentId,
    sessionId,
  };

  // Get current theme
  const theme = getThemeForMode(currentMode);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <EmotionalThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}

        {/* Notification Snackbar */}
        <Snackbar
          open={notificationOpen}
          autoHideDuration={3000}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={notificationSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notificationMessage}
          </Alert>
        </Snackbar>
      </MuiThemeProvider>
    </EmotionalThemeContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useEmotionalTheme = (): EmotionalThemeContextType => {
  const context = useContext(EmotionalThemeContext);
  if (!context) {
    throw new Error('useEmotionalTheme must be used within EmotionalThemeProvider');
  }
  return context;
};
