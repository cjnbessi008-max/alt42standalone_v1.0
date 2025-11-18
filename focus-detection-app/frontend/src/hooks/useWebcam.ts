import { useEffect, useRef, useState } from 'react';
import { WebcamConfig } from '@/types';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
  error: string | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
}

const defaultConfig: WebcamConfig = {
  width: 640,
  height: 480,
  fps: 30,
  facingMode: 'user',
};

export const useWebcam = (config: Partial<WebcamConfig> = {}): UseWebcamReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalConfig = { ...defaultConfig, ...config };

  const startWebcam = async () => {
    try {
      setError(null);
      setIsReady(false);

      // 웹캠 권한 요청 및 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: finalConfig.width },
          height: { ideal: finalConfig.height },
          frameRate: { ideal: finalConfig.fps },
          facingMode: finalConfig.facingMode,
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // 비디오가 로드될 때까지 대기
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });

        setIsReady(true);
      }
    } catch (err) {
      console.error('웹캠 시작 실패:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('웹캠 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('웹캠을 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
        } else {
          setError(`웹캠 시작 실패: ${err.message}`);
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  };

  // 컴포넌트 언마운트 시 웹캠 정리
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return {
    videoRef,
    isReady,
    error,
    startWebcam,
    stopWebcam,
  };
};
