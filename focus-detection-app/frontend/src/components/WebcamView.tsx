import React, { useEffect } from 'react';
import { useWebcam } from '@/hooks/useWebcam';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { FocusData } from '@/types';

interface WebcamViewProps {
  onFocusUpdate?: (focusData: FocusData) => void;
  className?: string;
  showVideo?: boolean;
}

export const WebcamView: React.FC<WebcamViewProps> = ({
  onFocusUpdate,
  className = '',
  showVideo = true,
}) => {
  const { videoRef, isReady, error: webcamError, startWebcam, stopWebcam } = useWebcam();
  const {
    isInitialized,
    currentFocus,
    error: detectionError,
    startDetection,
    stopDetection,
  } = useFaceDetection(onFocusUpdate);

  // 웹캠 시작
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  // 얼굴 감지 시작
  useEffect(() => {
    if (isReady && isInitialized && videoRef.current) {
      startDetection(videoRef.current);
    }

    return () => {
      stopDetection();
    };
  }, [isReady, isInitialized, startDetection, stopDetection, videoRef]);

  const error = webcamError || detectionError;

  return (
    <div className={`relative ${className}`}>
      {/* 비디오 요소 */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover rounded-lg ${showVideo ? '' : 'hidden'}`}
        autoPlay
        playsInline
        muted
      />

      {/* 로딩 오버레이 */}
      {!isReady && !error && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>웹캠 초기화 중...</p>
          </div>
        </div>
      )}

      {/* 에러 오버레이 */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg p-6">
          <div className="text-white text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-medium mb-2">오류 발생</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={startWebcam}
              className="mt-4 px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100 transition"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 상태 인디케이터 */}
      {isReady && !error && (
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
            실시간 감지 중
          </span>
        </div>
      )}

      {/* 집중도 표시 (선택) */}
      {showVideo && currentFocus && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
          <div className="text-2xl font-bold">{Math.round(currentFocus.score)}</div>
          <div className="text-xs">집중도</div>
        </div>
      )}
    </div>
  );
};
