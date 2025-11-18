/**
 * Color Mode Selector Component
 * UI for manual color mode selection and auto-mode toggle
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Spa as SpaIcon,
  Bolt as BoltIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';

import { useEmotionalTheme } from '../contexts/EmotionalThemeContext';
import { ColorMode } from '../types/emotion';
import { colorModeDescriptions, colorModeNames } from '../themes/colorModeThemes';

interface ColorModeSelectorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultExpanded?: boolean;
  showConnectionStatus?: boolean;
}

const colorModeIcons: Record<ColorMode, React.ReactElement> = {
  neutral: <PaletteIcon />,
  calming: <SpaIcon />,
  energetic: <BoltIcon />,
  refresh: <RefreshIcon />,
};

export const ColorModeSelector: React.FC<ColorModeSelectorProps> = ({
  position = 'bottom-right',
  defaultExpanded = false,
  showConnectionStatus = true,
}) => {
  const {
    currentMode,
    emotionalState,
    autoModeEnabled,
    isConnected,
    setManualMode,
    toggleAutoMode,
  } = useEmotionalTheme();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [visible, setVisible] = useState(true);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.value as ColorMode;
    setManualMode(newMode);
  };

  const handleAutoToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleAutoMode(event.target.checked);
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1300,
      margin: 2,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 0, right: 0 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 0, left: 0 };
      case 'top-right':
        return { ...baseStyles, top: 0, right: 0 };
      case 'top-left':
        return { ...baseStyles, top: 0, left: 0 };
      default:
        return { ...baseStyles, bottom: 0, right: 0 };
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Box sx={getPositionStyles()}>
      <Card elevation={6} sx={{ minWidth: 280, maxWidth: 360 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon />
            <Typography variant="h6" component="div">
              Color Mode
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showConnectionStatus && (
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <IconButton size="small" sx={{ color: 'inherit' }}>
                  {isConnected ? (
                    <WifiIcon fontSize="small" />
                  ) : (
                    <WifiOffIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}

            <IconButton
              size="small"
              onClick={handleToggleExpanded}
              sx={{ color: 'inherit' }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>

            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'inherit' }}
              aria-label="Close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={expanded}>
          <CardContent>
            {/* Auto Mode Toggle */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoModeEnabled}
                    onChange={handleAutoToggle}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Auto Mode</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {autoModeEnabled
                        ? 'Automatically adjusts based on your state'
                        : 'Manual color mode selection'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Current State */}
            {autoModeEnabled && emotionalState && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Detected State:</strong> {emotionalState}
                </Typography>
              </Alert>
            )}

            {/* Color Mode Selection */}
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">
                <Typography variant="subtitle2" gutterBottom>
                  Select Color Mode
                </Typography>
              </FormLabel>

              <RadioGroup
                value={currentMode}
                onChange={handleModeChange}
                sx={{ mt: 1 }}
              >
                {(['neutral', 'calming', 'energetic', 'refresh'] as ColorMode[]).map(
                  (mode) => (
                    <Box key={mode} sx={{ mb: 1 }}>
                      <FormControlLabel
                        value={mode}
                        control={<Radio />}
                        disabled={autoModeEnabled}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {colorModeIcons[mode]}
                            <Box>
                              <Typography variant="body1">
                                {colorModeNames[mode]}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {colorModeDescriptions[mode]}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{
                          border: currentMode === mode ? 2 : 1,
                          borderColor:
                            currentMode === mode ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          p: 1,
                          m: 0,
                          width: '100%',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      />
                    </Box>
                  )
                )}
              </RadioGroup>
            </FormControl>

            {/* Current Mode Indicator */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Chip
                icon={colorModeIcons[currentMode]}
                label={`Current: ${colorModeNames[currentMode]}`}
                color="primary"
                variant="filled"
              />
            </Box>
          </CardContent>
        </Collapse>

        {/* Collapsed Preview */}
        {!expanded && (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Chip
              icon={colorModeIcons[currentMode]}
              label={colorModeNames[currentMode]}
              color="primary"
              size="small"
            />
            {autoModeEnabled && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Auto Mode On
              </Typography>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default ColorModeSelector;
