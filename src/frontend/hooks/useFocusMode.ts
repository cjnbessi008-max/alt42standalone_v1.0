/**
 * useFocusMode Hook
 * Main hook that combines eye tracking, blink detection, and focus mode management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEyeTracking } from './useEyeTracking';
import { BlinkDetector } from '../services/BlinkDetector';
import { FocusModeController } from '../services/FocusModeController';
import type {
  FocusModeConfig,
  FocusModeCallbacks,
  BlinkEvent,
  BlinkMetrics,
  FocusMetrics,
  EyeLandmarks,
  DEFAULT_FOCUS_CONFIG,
} from '../types/focus-mode.types';

interface UseFocusModeOptions {
  config?: Partial<FocusModeConfig>;
  callbacks?: FocusModeCallbacks;
  autoStart?: boolean;
}

export function useFocusMode(options: UseFocusModeOptions = {}) {
  const {
    config: userConfig = {},
    callbacks = {},
    autoStart = false,
  } = options;

  // Merge user config with defaults
  const config: FocusModeConfig = { ...DEFAULT_FOCUS_CONFIG, ...userConfig };

  // State
  const [isActive, setIsActive] = useState(false);
  const [blinkMetrics, setBlinkMetrics] = useState<BlinkMetrics>({
    totalBlinks: 0,
    blinksPerMinute: 0,
    averageBlinkDuration: 0,
    lastBlinkTimestamp: 0,
  });
  const [focusMetrics, setFocusMetrics] = useState<FocusMetrics>({
    state: 'unknown',
    blinksPerMinute: 0,
    focusDuration: 0,
    confidenceScore: 0,
  });

  // Services
  const blinkDetectorRef = useRef<BlinkDetector | null>(null);
  const focusControllerRef = useRef<FocusModeController | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    blinkDetectorRef.current = new BlinkDetector(config);
    focusControllerRef.current = new FocusModeController(config, {
      ...callbacks,
      onFocusStart: (metrics) => {
        console.log('🎯 Focus mode activated!', metrics);
        if (callbacks.onFocusStart) callbacks.onFocusStart(metrics);
      },
      onFocusEnd: (metrics) => {
        console.log('👋 Focus mode deactivated', metrics);
        if (callbacks.onFocusEnd) callbacks.onFocusEnd(metrics);
      },
    });

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  /**
   * Handle eye landmarks from tracking
   */
  const handleEyeLandmarks = useCallback((landmarks: EyeLandmarks) => {
    if (!blinkDetectorRef.current || !focusControllerRef.current) {
      return;
    }

    // Process frame for blink detection
    const blinkEvent = blinkDetectorRef.current.processFrame(landmarks);

    // If blink detected, trigger callback
    if (blinkEvent && callbacks.onBlinkDetected) {
      callbacks.onBlinkDetected(blinkEvent);
    }

    // Update metrics every frame
    const currentMetrics = blinkDetectorRef.current.getMetrics(config.windowSize);
    setBlinkMetrics(currentMetrics);

    // Update focus controller
    const currentFocusMetrics = focusControllerRef.current.updateBlinkRate(currentMetrics);
    setFocusMetrics(currentFocusMetrics);
  }, [config.windowSize, callbacks]);

  /**
   * Handle tracking errors
   */
  const handleTrackingError = useCallback((error: Error) => {
    console.error('Eye tracking error:', error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  }, [callbacks]);

  // Eye tracking hook
  const {
    state: trackingState,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking,
  } = useEyeTracking({
    config,
    onEyeLandmarks: handleEyeLandmarks,
    onError: handleTrackingError,
  });

  /**
   * Start focus mode
   */
  const start = useCallback(async () => {
    try {
      await startTracking();
      setIsActive(true);

      // Start periodic metrics update
      if (config.sendMetricsToServer) {
        updateIntervalRef.current = setInterval(() => {
          // Here you would send metrics to server
          console.log('📊 Metrics update:', {
            blink: blinkMetrics,
            focus: focusMetrics,
          });
        }, config.metricsInterval * 1000);
      }
    } catch (error) {
      console.error('Failed to start focus mode:', error);
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
  }, [startTracking, config, blinkMetrics, focusMetrics, callbacks]);

  /**
   * Stop focus mode
   */
  const stop = useCallback(() => {
    stopTracking();
    setIsActive(false);

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Reset services
    blinkDetectorRef.current?.reset();
    focusControllerRef.current?.reset();
  }, [stopTracking]);

  /**
   * Reset all metrics
   */
  const reset = useCallback(() => {
    blinkDetectorRef.current?.reset();
    focusControllerRef.current?.reset();

    setBlinkMetrics({
      totalBlinks: 0,
      blinksPerMinute: 0,
      averageBlinkDuration: 0,
      lastBlinkTimestamp: 0,
    });

    setFocusMetrics({
      state: 'unknown',
      blinksPerMinute: 0,
      focusDuration: 0,
      confidenceScore: 0,
    });
  }, []);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (isActive) {
        stop();
      }
    };
  }, [autoStart]);

  return {
    // State
    isActive,
    isFocused: focusMetrics.state === 'focused',
    focusState: focusMetrics.state,
    blinkMetrics,
    focusMetrics,
    trackingState,

    // Controls
    start,
    stop,
    reset,

    // Refs for video/canvas
    videoRef,
    canvasRef,

    // Services (for advanced usage)
    blinkDetector: blinkDetectorRef.current,
    focusController: focusControllerRef.current,
  };
}
