/**
 * Color Mode Theme Definitions
 * Defines Material-UI themes for each emotional color mode
 */

import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { ColorMode } from '../types/emotion';

/**
 * Base theme configuration shared across all modes
 */
const baseThemeConfig: ThemeOptions = {
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
  },
  shape: {
    borderRadius: 8,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 800, // Smooth transition for color mode changes
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      // Custom easing for smooth color transitions
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          transition: 'background-color 800ms cubic-bezier(0.4, 0.0, 0.2, 1), color 800ms cubic-bezier(0.4, 0.0, 0.2, 1), border-color 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        },
      },
    },
  },
};

/**
 * Neutral/Productivity Mode
 * For calm, focused learning state
 */
const neutralTheme: ThemeOptions = {
  ...baseThemeConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#2196F3', // Professional blue
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#455A64', // Neutral grey-blue
      light: '#718792',
      dark: '#1C313A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // Clean white
      paper: '#F5F5F5', // Light grey
    },
    text: {
      primary: '#212121', // Dark grey
      secondary: '#757575', // Medium grey
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
    success: {
      main: '#4CAF50',
    },
  },
};

/**
 * Calming Mode
 * For stressed, frustrated, or anxious state
 */
const calmingTheme: ThemeOptions = {
  ...baseThemeConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#81C784', // Soft green (nature, growth)
      light: '#A5D6A7',
      dark: '#66BB6A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#90CAF9', // Gentle blue (calm, trust)
      light: '#BBDEFB',
      dark: '#64B5F6',
      contrastText: '#000000',
    },
    background: {
      default: '#F1F8F4', // Very light green-tinted white
      paper: '#E8F5E9', // Pale green
    },
    text: {
      primary: '#2E7D32', // Forest green (grounding)
      secondary: '#66BB6A', // Medium green
      disabled: '#A5D6A7',
    },
    divider: '#C8E6C9',
    error: {
      main: '#81C784', // Softer error color (less alarming)
    },
    warning: {
      main: '#AED581',
    },
    info: {
      main: '#90CAF9',
    },
    success: {
      main: '#81C784',
    },
  },
};

/**
 * Energetic/Vibrant Mode
 * For engaged, motivated learning state
 */
const energeticTheme: ThemeOptions = {
  ...baseThemeConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#FF9800', // Energizing orange
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFC107', // Optimistic yellow
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#000000',
    },
    background: {
      default: '#FFFBF0', // Warm white
      paper: '#FFF3E0', // Light orange tint
    },
    text: {
      primary: '#E65100', // Deep orange
      secondary: '#F57C00', // Vibrant orange
      disabled: '#FFCC80',
    },
    divider: '#FFE0B2',
    error: {
      main: '#FF5722',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#FF9800',
    },
    success: {
      main: '#FFC107',
    },
  },
};

/**
 * Refresh/Wake Mode
 * For tired, disengaged state
 */
const refreshTheme: ThemeOptions = {
  ...baseThemeConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#E91E63', // Vibrant pink (attention)
      light: '#F06292',
      dark: '#C2185B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00BCD4', // Bright cyan (alertness)
      light: '#4DD0E1',
      dark: '#0097A7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // Pure white (clarity)
      paper: '#FCE4EC', // Light pink tint
    },
    text: {
      primary: '#880E4F', // Deep magenta
      secondary: '#C2185B', // Rich pink
      disabled: '#F48FB1',
    },
    divider: '#F8BBD0',
    error: {
      main: '#E91E63',
    },
    warning: {
      main: '#FF4081',
    },
    info: {
      main: '#00BCD4',
    },
    success: {
      main: '#00E676',
    },
  },
};

/**
 * Theme map for easy lookup
 */
export const colorModeThemes: Record<ColorMode, Theme> = {
  neutral: createTheme(neutralTheme),
  calming: createTheme(calmingTheme),
  energetic: createTheme(energeticTheme),
  refresh: createTheme(refreshTheme),
};

/**
 * Get theme by color mode
 */
export const getThemeForMode = (mode: ColorMode): Theme => {
  return colorModeThemes[mode] || colorModeThemes.neutral;
};

/**
 * Color mode descriptions for UI
 */
export const colorModeDescriptions: Record<ColorMode, string> = {
  neutral: 'Balanced and professional for focused work',
  calming: 'Soothing colors to reduce stress and promote calm',
  energetic: 'Vibrant and motivating for active engagement',
  refresh: 'High contrast to re-energize and increase alertness',
};

/**
 * Color mode icons (using Material Icons names)
 */
export const colorModeIcons: Record<ColorMode, string> = {
  neutral: 'palette',
  calming: 'spa',
  energetic: 'bolt',
  refresh: 'refresh',
};

/**
 * Color mode display names
 */
export const colorModeNames: Record<ColorMode, string> = {
  neutral: 'Neutral',
  calming: 'Calming',
  energetic: 'Energetic',
  refresh: 'Refresh',
};
