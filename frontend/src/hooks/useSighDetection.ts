/**
 * 한숨 감지 훅
 * 오디오 스트림에서 한숨을 감지하고 휴식을 제안합니다.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeSighFromAudio, getSuggestion } from '../services/api';

interface SighDetectionResult {
  detected: boolean;
  intensity: string | null;
  confidence: number;
  timestamp: string;
  should_suggest_break: boolean;
  stress_level: number;
}

interface BreakSuggestion {
  student_id: string;
  stress_level: number;
  reason: string;
  reason_ko: string;
  recommended_activities: any[];
  timestamp: string;
}

interface UseSighDetectionOptions {
  studentId: string;
  enabled?: boolean;
  checkInterval?: number; // ms
  audioSampleDuration?: number; // seconds
  onBreakSuggested?: (suggestion: BreakSuggestion) => void;
}

interface UseSighDetectionReturn {
  isDetecting: boolean;
  stressLevel: number;
  sighCount: number;
  lastSighTime: Date | null;
  suggestion: BreakSuggestion | null;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  error: string | null;
}

export const useSighDetection = ({
  studentId,
  enabled = true,
  checkInterval = 5000,
  audioSampleDuration = 2,
  onBreakSuggested
}: UseSighDetectionOptions): UseSighDetectionReturn => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [stressLevel, setStressLevel] = useState(0);
  const [sighCount, setSighCount] = useState(0);
  const [lastSighTime, setLastSighTime] = useState<Date | null>(null);
  const [suggestion, setSuggestion] = useState<BreakSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const learningStartTimeRef = useRef<Date>(new Date());

  /**
   * 오디오 스트림 초기화
   */
  const initializeAudioStream = useCallback(async () => {
    try {
      // 마이크 권한 요청 및 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // AudioContext 생성
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Analyzer 노드 생성
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzerRef.current = analyzer;

      // 스트림을 AudioContext에 연결
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      return true;
    } catch (err) {
      console.error('Failed to initialize audio stream:', err);
      setError('마이크 접근 권한이 필요합니다.');
      return false;
    }
  }, []);

  /**
   * 오디오 샘플 캡처
   */
  const captureAudioSample = useCallback((): Float32Array | null => {
    if (!analyzerRef.current) return null;

    const bufferLength = analyzerRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyzerRef.current.getFloatTimeDomainData(dataArray);

    return dataArray;
  }, []);

  /**
   * 한숨 감지 실행
   */
  const detectSigh = useCallback(async () => {
    if (!isDetecting) return;

    try {
      // 오디오 샘플 캡처
      const audioSample = captureAudioSample();
      if (!audioSample) return;

      // 서버로 전송하여 분석
      const result: SighDetectionResult = await analyzeSighFromAudio(
        studentId,
        Array.from(audioSample),
        16000
      );

      // 한숨 감지됨
      if (result.detected && result.confidence >= 0.7) {
        setSighCount((prev) => prev + 1);
        setLastSighTime(new Date());
      }

      // 스트레스 레벨 업데이트
      setStressLevel(result.stress_level);

      // 휴식 제안 필요
      if (result.should_suggest_break) {
        const learningDuration = Math.floor(
          (new Date().getTime() - learningStartTimeRef.current.getTime()) / 60000
        );

        // 휴식 제안 가져오기
        const breakSuggestion = await getSuggestion(
          studentId,
          result.stress_level,
          learningDuration,
          sighCount
        );

        setSuggestion(breakSuggestion);

        if (onBreakSuggested) {
          onBreakSuggested(breakSuggestion);
        }
      }
    } catch (err) {
      console.error('Sigh detection error:', err);
      setError('한숨 감지 중 오류가 발생했습니다.');
    }
  }, [isDetecting, studentId, sighCount, captureAudioSample, onBreakSuggested]);

  /**
   * 감지 시작
   */
  const startDetection = useCallback(async () => {
    if (isDetecting) return;

    // 오디오 스트림 초기화
    const initialized = await initializeAudioStream();
    if (!initialized) return;

    setIsDetecting(true);
    setError(null);
    learningStartTimeRef.current = new Date();

    // 주기적으로 감지 실행
    detectionIntervalRef.current = setInterval(() => {
      detectSigh();
    }, checkInterval);
  }, [isDetecting, initializeAudioStream, detectSigh, checkInterval]);

  /**
   * 감지 중지
   */
  const stopDetection = useCallback(() => {
    setIsDetecting(false);

    // 인터벌 정리
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // 오디오 스트림 정리
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // AudioContext 정리
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyzerRef.current = null;
  }, []);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  /**
   * enabled 옵션에 따라 자동 시작/중지
   */
  useEffect(() => {
    if (enabled && !isDetecting) {
      startDetection();
    } else if (!enabled && isDetecting) {
      stopDetection();
    }
  }, [enabled, isDetecting, startDetection, stopDetection]);

  return {
    isDetecting,
    stressLevel,
    sighCount,
    lastSighTime,
    suggestion,
    startDetection,
    stopDetection,
    error
  };
};

export default useSighDetection;
