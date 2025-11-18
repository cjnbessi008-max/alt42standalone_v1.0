import React, { useEffect, useState, useCallback } from 'react';
import { useFocusDetection } from '../hooks/useFocusDetection';
import { IdleBreakGuide } from './IdleBreakGuide';
import focusTrackingService from '../services/focusTrackingService';

/**
 * StudentLearningContainer Props
 */
export interface StudentLearningContainerProps {
  /** 학생 ID */
  studentId: string;
  /** 모듈 ID */
  moduleId: string;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 집중 이탈 감지 임계값 (밀리초) */
  idleThreshold?: number;
  /** 휴식 가이드 지속 시간 (초) */
  breakDuration?: number;
  /** 휴식 가이드 활성화 여부 */
  enableBreakGuide?: boolean;
  /** 건너뛰기 허용 여부 */
  allowSkipBreak?: boolean;
}

/**
 * 학생 학습 컨테이너
 *
 * 집중 이탈 감지 및 휴식 가이드를 통합한 학습 환경을 제공합니다.
 * LMS와 자동으로 연동되어 학생의 집중도를 추적합니다.
 *
 * @example
 * ```tsx
 * <StudentLearningContainer
 *   studentId="student123"
 *   moduleId="module456"
 *   idleThreshold={30000}
 *   breakDuration={15}
 * >
 *   <LearningContent />
 * </StudentLearningContainer>
 * ```
 */
export const StudentLearningContainer: React.FC<StudentLearningContainerProps> = ({
  studentId,
  moduleId,
  children,
  idleThreshold = 30000, // 30초
  breakDuration = 15,
  enableBreakGuide = true,
  allowSkipBreak = true,
}) => {
  const [showBreakGuide, setShowBreakGuide] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 세션 시작
  useEffect(() => {
    const id = focusTrackingService.startSession(studentId, moduleId);
    setSessionId(id);

    return () => {
      focusTrackingService.endSession();
    };
  }, [studentId, moduleId]);

  // 집중 이탈 감지 콜백
  const handleFocusLost = useCallback(() => {
    console.log('Focus lost detected');
    focusTrackingService.trackFocusLost(studentId, moduleId);

    if (enableBreakGuide) {
      setShowBreakGuide(true);
    }
  }, [studentId, moduleId, enableBreakGuide]);

  // 집중 복귀 콜백
  const handleFocusRegained = useCallback(() => {
    console.log('Focus regained');
    focusTrackingService.trackFocusRegained(studentId, moduleId);
  }, [studentId, moduleId]);

  // 비활동 감지 콜백
  const handleIdleDetected = useCallback(
    (idleTime: number) => {
      console.log('Idle detected:', idleTime);
      focusTrackingService.trackFocusLost(studentId, moduleId, idleTime);
    },
    [studentId, moduleId]
  );

  // 집중 이탈 감지 훅
  const { isFocusLost, idleTime } = useFocusDetection({
    idleThreshold,
    trackVisibility: true,
    trackActivity: true,
    onFocusLost: handleFocusLost,
    onFocusRegained: handleFocusRegained,
    onIdleDetected: handleIdleDetected,
  });

  // 휴식 가이드 완료
  const handleBreakComplete = useCallback(() => {
    console.log('Break completed');
    setShowBreakGuide(false);
  }, []);

  // 휴식 가이드 닫기
  const handleBreakClose = useCallback(() => {
    console.log('Break guide closed');
    setShowBreakGuide(false);
  }, []);

  // 휴식 활동 로그
  const handleLogActivity = useCallback(
    (activity: {
      activityType: string;
      duration: number;
      completed: boolean;
      timestamp: number;
    }) => {
      console.log('Break activity logged:', activity);

      if (activity.completed) {
        focusTrackingService.trackBreakCompleted(
          studentId,
          moduleId,
          activity.activityType,
          activity.duration
        );
      } else {
        focusTrackingService.trackBreakSkipped(
          studentId,
          moduleId,
          activity.activityType,
          activity.duration
        );
      }
    },
    [studentId, moduleId]
  );

  return (
    <div className="student-learning-container">
      {children}

      {/* 휴식 가이드 */}
      <IdleBreakGuide
        isOpen={showBreakGuide}
        duration={breakDuration}
        onComplete={handleBreakComplete}
        onClose={handleBreakClose}
        allowSkip={allowSkipBreak}
        onLogActivity={handleLogActivity}
      />

      {/* 개발 모드 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10000,
          }}
        >
          <div>Session: {sessionId?.substring(0, 20)}...</div>
          <div>Focus Lost: {isFocusLost ? 'YES' : 'NO'}</div>
          <div>Idle Time: {Math.floor(idleTime / 1000)}s</div>
          <div>Break Guide: {showBreakGuide ? 'SHOWING' : 'HIDDEN'}</div>
        </div>
      )}
    </div>
  );
};

export default StudentLearningContainer;
