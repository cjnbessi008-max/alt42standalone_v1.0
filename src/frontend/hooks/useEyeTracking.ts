/**
 * useEyeTracking Hook
 * React hook for eye tracking using MediaPipe Face Mesh
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  EyeLandmarks,
  EyeTrackingState,
  FocusModeConfig,
  Point,
} from '../types/focus-mode.types';

// MediaPipe Face Mesh landmark indices for eyes
// Left eye: 33, 160, 158, 133, 153, 144
// Right eye: 362, 385, 387, 263, 373, 380
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

interface UseEyeTrackingOptions {
  config: FocusModeConfig;
  onEyeLandmarks?: (landmarks: EyeLandmarks) => void;
  onError?: (error: Error) => void;
}

export function useEyeTracking(options: UseEyeTrackingOptions) {
  const { config, onEyeLandmarks, onError } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<EyeTrackingState>({
    isTracking: false,
    facesDetected: 0,
    eyeLandmarks: null,
    error: null,
  });

  // Face Mesh will be loaded dynamically
  const faceMeshRef = useRef<any>(null);

  /**
   * Initialize MediaPipe Face Mesh
   */
  const initializeFaceMesh = useCallback(async () => {
    try {
      // Dynamic import for MediaPipe
      // In production, you would use: @mediapipe/face_mesh
      // For now, we'll create a mock interface
      console.log('Initializing MediaPipe Face Mesh...');

      // This is a placeholder - in real implementation, you would use:
      /*
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');

      faceMeshRef.current = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMeshRef.current.onResults(onFaceMeshResults);
      */

      // For demo purposes, create a mock that generates random eye movements
      faceMeshRef.current = {
        initialized: true,
        maxNumFaces: 1,
      };

      console.log('Face Mesh initialized successfully');
    } catch (error) {
      const err = error as Error;
      console.error('Failed to initialize Face Mesh:', err);
      setState(prev => ({ ...prev, error: err.message }));
      if (onError) onError(err);
    }
  }, [onError]);

  /**
   * Process Face Mesh results
   */
  const onFaceMeshResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setState(prev => ({
        ...prev,
        facesDetected: 0,
        eyeLandmarks: null,
      }));
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Extract eye landmarks
    const leftEye: Point[] = LEFT_EYE_INDICES.map(idx => ({
      x: landmarks[idx].x,
      y: landmarks[idx].y,
      z: landmarks[idx].z,
    }));

    const rightEye: Point[] = RIGHT_EYE_INDICES.map(idx => ({
      x: landmarks[idx].x,
      y: landmarks[idx].y,
      z: landmarks[idx].z,
    }));

    const eyeLandmarks: EyeLandmarks = { left: leftEye, right: rightEye };

    setState(prev => ({
      ...prev,
      facesDetected: results.multiFaceLandmarks.length,
      eyeLandmarks,
    }));

    if (onEyeLandmarks) {
      onEyeLandmarks(eyeLandmarks);
    }

    // Draw visualization
    if (canvasRef.current && videoRef.current) {
      drawLandmarks(canvasRef.current, landmarks);
    }
  }, [onEyeLandmarks]);

  /**
   * Draw face landmarks on canvas (for debugging/visualization)
   */
  const drawLandmarks = (canvas: HTMLCanvasElement, landmarks: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';

    // Draw all eye landmarks
    [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES].forEach(idx => {
      const point = landmarks[idx];
      ctx.beginPath();
      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  };

  /**
   * Start camera and eye tracking
   */
  const startTracking = useCallback(async () => {
    if (!config.cameraEnabled) {
      setState(prev => ({ ...prev, error: 'Camera is disabled in config' }));
      return;
    }

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: config.videoWidth,
          height: config.videoHeight,
          frameRate: config.frameRate,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize Face Mesh if not already done
      if (!faceMeshRef.current) {
        await initializeFaceMesh();
      }

      setState(prev => ({ ...prev, isTracking: true, error: null }));

      // Start processing frames
      processFrame();
    } catch (error) {
      const err = error as Error;
      console.error('Failed to start tracking:', err);
      setState(prev => ({ ...prev, error: err.message }));
      if (onError) onError(err);
    }
  }, [config, initializeFaceMesh, onError]);

  /**
   * Stop camera and eye tracking
   */
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isTracking: false,
      facesDetected: 0,
      eyeLandmarks: null,
    }));
  }, []);

  /**
   * Process video frames
   */
  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceMeshRef.current) {
      return;
    }

    // In production, send frame to Face Mesh:
    // await faceMeshRef.current.send({ image: videoRef.current });

    // For demo: Generate synthetic eye landmarks
    generateSyntheticLandmarks();

    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  /**
   * Generate synthetic eye landmarks for demo purposes
   * In production, this would be replaced by actual MediaPipe results
   */
  const generateSyntheticLandmarks = () => {
    // Simulate realistic eye movements and blinks
    const now = Date.now();
    const shouldBlink = Math.random() < 0.02; // ~2% chance per frame

    const baseY = 0.5;
    const eyeOpenness = shouldBlink ? 0.02 : 0.05 + Math.random() * 0.02;

    const leftEye: Point[] = [
      { x: 0.35, y: baseY },
      { x: 0.36, y: baseY - eyeOpenness },
      { x: 0.37, y: baseY - eyeOpenness },
      { x: 0.38, y: baseY },
      { x: 0.37, y: baseY + eyeOpenness },
      { x: 0.36, y: baseY + eyeOpenness },
    ];

    const rightEye: Point[] = [
      { x: 0.62, y: baseY },
      { x: 0.63, y: baseY - eyeOpenness },
      { x: 0.64, y: baseY - eyeOpenness },
      { x: 0.65, y: baseY },
      { x: 0.64, y: baseY + eyeOpenness },
      { x: 0.63, y: baseY + eyeOpenness },
    ];

    const eyeLandmarks: EyeLandmarks = { left: leftEye, right: rightEye };

    setState(prev => ({
      ...prev,
      facesDetected: 1,
      eyeLandmarks,
    }));

    if (onEyeLandmarks) {
      onEyeLandmarks(eyeLandmarks);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    state,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking,
  };
}
