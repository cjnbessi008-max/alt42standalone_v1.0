import React, { useState, useEffect, useCallback } from 'react';
import './IdleBreakGuide.css';

/**
 * 휴식 활동 유형
 */
export type BreakActivityType = 'breathing' | 'stretching' | 'eyes' | 'mindfulness';

/**
 * 휴식 활동 정의
 */
interface BreakActivity {
  type: BreakActivityType;
  title: string;
  description: string;
  instructions: string[];
  icon: string;
}

/**
 * 휴식 활동 목록
 */
const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    type: 'breathing',
    title: '호흡하기',
    description: '깊게 호흡하며 긴장을 풀어보세요',
    instructions: [
      '편안하게 앉아주세요',
      '천천히 코로 숨을 들이마시세요 (4초)',
      '숨을 잠시 멈추세요 (2초)',
      '천천히 입으로 숨을 내쉬세요 (4초)',
    ],
    icon: '🫁',
  },
  {
    type: 'stretching',
    title: '스트레칭',
    description: '몸을 가볍게 풀어주세요',
    instructions: [
      '양 팔을 위로 쭉 뻗어보세요',
      '고개를 천천히 좌우로 돌려보세요',
      '어깨를 앞뒤로 돌려주세요',
      '허리를 좌우로 가볍게 틀어보세요',
    ],
    icon: '🤸',
  },
  {
    type: 'eyes',
    title: '눈 휴식',
    description: '눈의 피로를 풀어주세요',
    instructions: [
      '눈을 감고 10초간 휴식하세요',
      '먼 곳을 5초간 바라보세요',
      '눈동자를 천천히 좌우로 움직이세요',
      '눈을 깜빡이며 눈물로 촉촉하게 해주세요',
    ],
    icon: '👁️',
  },
  {
    type: 'mindfulness',
    title: '마음챙김',
    description: '현재 순간에 집중해보세요',
    instructions: [
      '현재 내 몸의 감각을 느껴보세요',
      '주변 소리에 귀 기울여보세요',
      '지금 이 순간에만 집중하세요',
      '긍정적인 생각을 떠올려보세요',
    ],
    icon: '🧘',
  },
];

/**
 * IdleBreakGuide Props
 */
export interface IdleBreakGuideProps {
  /** 표시 여부 */
  isOpen: boolean;
  /** 휴식 시간 (초) */
  duration?: number;
  /** 완료 시 콜백 */
  onComplete?: () => void;
  /** 닫기 시 콜백 */
  onClose?: () => void;
  /** 건너뛰기 허용 여부 */
  allowSkip?: boolean;
  /** LMS 연동 콜백 */
  onLogActivity?: (activity: {
    activityType: BreakActivityType;
    duration: number;
    completed: boolean;
    timestamp: number;
  }) => void;
}

/**
 * 15초 멍때리기 가이드 컴포넌트
 *
 * 집중 이탈이 감지되면 표시되어 15초간 짧은 휴식을 가이드합니다.
 *
 * @example
 * ```tsx
 * <IdleBreakGuide
 *   isOpen={isFocusLost}
 *   duration={15}
 *   onComplete={() => console.log('Break completed')}
 *   onLogActivity={(activity) => api.logBreakActivity(activity)}
 * />
 * ```
 */
export const IdleBreakGuide: React.FC<IdleBreakGuideProps> = ({
  isOpen,
  duration = 15,
  onComplete,
  onClose,
  allowSkip = true,
  onLogActivity,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentActivity, setCurrentActivity] = useState<BreakActivity>(
    BREAK_ACTIVITIES[0]
  );
  const [startTime, setStartTime] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 가이드가 열릴 때 랜덤 활동 선택 및 초기화
  useEffect(() => {
    if (isOpen) {
      const randomActivity =
        BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
      setCurrentActivity(randomActivity);
      setTimeLeft(duration);
      setStartTime(Date.now());
      setIsAnimating(true);

      // 애니메이션 초기화
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isOpen, duration]);

  // 타이머
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // 완료 처리
  const handleComplete = useCallback(
    (completed: boolean) => {
      const elapsed = Date.now() - startTime;

      // LMS에 활동 로그 전송
      if (onLogActivity) {
        onLogActivity({
          activityType: currentActivity.type,
          duration: elapsed / 1000,
          completed,
          timestamp: Date.now(),
        });
      }

      // 완료 콜백
      if (completed && onComplete) {
        onComplete();
      }

      // 닫기 콜백
      if (onClose) {
        onClose();
      }
    },
    [startTime, currentActivity, onLogActivity, onComplete, onClose]
  );

  // 건너뛰기
  const handleSkip = useCallback(() => {
    handleComplete(false);
  }, [handleComplete]);

  // 현재 지침 인덱스 계산
  const currentInstructionIndex = Math.min(
    Math.floor(((duration - timeLeft) / duration) * currentActivity.instructions.length),
    currentActivity.instructions.length - 1
  );

  if (!isOpen) return null;

  return (
    <div
      className={`idle-break-overlay ${isAnimating ? 'idle-break-overlay--animating' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-break-title"
      aria-describedby="idle-break-description"
    >
      <div className="idle-break-container">
        {/* 헤더 */}
        <div className="idle-break-header">
          <div className="idle-break-icon">{currentActivity.icon}</div>
          <h2 id="idle-break-title" className="idle-break-title">
            {currentActivity.title}
          </h2>
          <p id="idle-break-description" className="idle-break-description">
            {currentActivity.description}
          </p>
        </div>

        {/* 타이머 */}
        <div className="idle-break-timer">
          <svg className="idle-break-timer-circle" viewBox="0 0 100 100">
            <circle
              className="idle-break-timer-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              className="idle-break-timer-progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (timeLeft / duration)}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="idle-break-timer-text">
            <span className="idle-break-timer-seconds">{timeLeft}</span>
            <span className="idle-break-timer-label">초</span>
          </div>
        </div>

        {/* 지침 */}
        <div className="idle-break-instructions">
          {currentActivity.instructions.map((instruction, index) => (
            <div
              key={index}
              className={`idle-break-instruction ${
                index === currentInstructionIndex
                  ? 'idle-break-instruction--active'
                  : index < currentInstructionIndex
                  ? 'idle-break-instruction--completed'
                  : ''
              }`}
            >
              <div className="idle-break-instruction-number">{index + 1}</div>
              <div className="idle-break-instruction-text">{instruction}</div>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        {allowSkip && (
          <div className="idle-break-actions">
            <button
              className="idle-break-skip-button"
              onClick={handleSkip}
              type="button"
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* 진행률 표시 */}
        <div className="idle-break-progress-bar">
          <div
            className="idle-break-progress-fill"
            style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default IdleBreakGuide;
