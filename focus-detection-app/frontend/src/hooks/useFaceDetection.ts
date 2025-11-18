import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { FocusData, MediaPipeConfig } from '@/types';
import { calculateTotalFocusScore } from '@/utils/focusCalculator';

interface UseFaceDetectionReturn {
  isInitialized: boolean;
  currentFocus: FocusData | null;
  error: string | null;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

const defaultConfig: MediaPipeConfig = {
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

export const useFaceDetection = (
  onFocusUpdate?: (focusData: FocusData) => void,
  config: Partial<MediaPipeConfig> = {}
): UseFaceDetectionReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<FocusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const previousPoseRef = useRef<{ pitch: number; yaw: number; roll: number } | null>(null);

  const finalConfig = { ...defaultConfig, ...config };

  // 얼굴 랜드마크로부터 고개 방향 계산
  const calculateHeadPose = (landmarks: any[]): { pitch: number; yaw: number; roll: number } => {
    // MediaPipe Face Mesh 주요 랜드마크 인덱스
    const noseTip = landmarks[1];
    const chinBottom = landmarks[152];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Yaw (좌우 회전) 계산
    const eyeDistance = rightEye.x - leftEye.x;
    const mouthDistance = rightMouth.x - leftMouth.x;
    const yaw = Math.atan2(mouthDistance - eyeDistance, eyeDistance) * (180 / Math.PI);

    // Pitch (상하 회전) 계산
    const noseToChain = chinBottom.y - noseTip.y;
    const pitch = Math.atan2(noseToChain, 0.3) * (180 / Math.PI) - 90;

    // Roll (기울기) 계산
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = eyeAngle * (180 / Math.PI);

    return { pitch, yaw, roll };
  };

  // 시선 방향 계산 (간단한 버전)
  const calculateGazeDirection = (landmarks: any[]): { x: number; y: number } => {
    // 눈 랜드마크를 사용한 시선 추정
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];
    const leftPupil = landmarks[468];
    const rightPupil = landmarks[473];

    // 양쪽 눈동자의 중심점
    const leftGazeX = (leftPupil.x - (leftEyeInner.x + leftEyeOuter.x) / 2) * 10;
    const leftGazeY = (leftPupil.y - leftEyeInner.y) * 10;

    const rightGazeX = (rightPupil.x - (rightEyeInner.x + rightEyeOuter.x) / 2) * 10;
    const rightGazeY = (rightPupil.y - rightEyeInner.y) * 10;

    // 평균값 사용
    return {
      x: (leftGazeX + rightGazeX) / 2,
      y: (leftGazeY + rightGazeY) / 2,
    };
  };

  // MediaPipe 결과 처리
  const onResults = useCallback((results: Results) => {
    try {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // 고개 방향 계산
        const headPose = calculateHeadPose(landmarks);

        // 시선 방향 계산
        const gazeDirection = calculateGazeDirection(landmarks);

        // 전체 집중도 점수 계산
        const focusData = calculateTotalFocusScore(
          true, // 얼굴 감지됨
          gazeDirection.x,
          gazeDirection.y,
          headPose,
          previousPoseRef.current
        );

        // 이전 포즈 업데이트
        previousPoseRef.current = headPose;

        // 상태 업데이트
        setCurrentFocus(focusData);

        // 콜백 호출
        if (onFocusUpdate) {
          onFocusUpdate(focusData);
        }
      } else {
        // 얼굴이 감지되지 않음
        const focusData: FocusData = {
          timestamp: Date.now(),
          score: 0,
          faceDetected: false,
          gazeScore: 0,
          headPoseScore: 0,
          movementScore: 0,
        };

        setCurrentFocus(focusData);

        if (onFocusUpdate) {
          onFocusUpdate(focusData);
        }
      }
    } catch (err) {
      console.error('결과 처리 중 오류:', err);
    }
  }, [onFocusUpdate]);

  // MediaPipe 초기화
  const initializeFaceMesh = useCallback(async () => {
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: finalConfig.maxNumFaces,
        refineLandmarks: finalConfig.refineLandmarks,
        minDetectionConfidence: finalConfig.minDetectionConfidence,
        minTrackingConfidence: finalConfig.minTrackingConfidence,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('FaceMesh 초기화 실패:', err);
      setError('얼굴 인식 초기화에 실패했습니다.');
    }
  }, [onResults, finalConfig]);

  // 감지 시작
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!faceMeshRef.current) {
      setError('FaceMesh가 초기화되지 않았습니다.');
      return;
    }

    try {
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      setError('카메라 시작에 실패했습니다.');
    }
  }, []);

  // 감지 중지
  const stopDetection = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    previousPoseRef.current = null;
    setCurrentFocus(null);
  }, []);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeFaceMesh();

    return () => {
      stopDetection();
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [initializeFaceMesh, stopDetection]);

  return {
    isInitialized,
    currentFocus,
    error,
    startDetection,
    stopDetection,
  };
};
