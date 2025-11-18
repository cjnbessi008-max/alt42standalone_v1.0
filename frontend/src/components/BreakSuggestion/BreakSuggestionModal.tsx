/**
 * 휴식 제안 모달 컴포넌트
 * 학생에게 휴식이 필요할 때 표시되는 모달
 */
import React, { useState, useEffect } from 'react';
import './BreakSuggestionModal.css';

interface BreakActivity {
  activity_id: string;
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  duration_minutes: number;
  break_type: string;
  difficulty: string;
}

interface BreakSuggestion {
  student_id: string;
  stress_level: number;
  reason: string;
  reason_ko: string;
  recommended_activities: BreakActivity[];
  timestamp: string;
}

interface BreakSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (activityId: string) => void;
  suggestion: BreakSuggestion | null;
  language?: 'ko' | 'en';
}

const BreakSuggestionModal: React.FC<BreakSuggestionModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  suggestion,
  language = 'ko'
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(10);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
      setSelectedActivity(null);
    }
  }, [isOpen]);

  if (!isOpen || !suggestion) {
    return null;
  }

  const handleAccept = () => {
    if (selectedActivity) {
      onAccept(selectedActivity);
    } else if (suggestion.recommended_activities.length > 0) {
      onAccept(suggestion.recommended_activities[0].activity_id);
    }
    onClose();
  };

  const getStressLevelText = (level: number) => {
    if (level >= 0.8) {
      return language === 'ko' ? '매우 높음' : 'Very High';
    } else if (level >= 0.6) {
      return language === 'ko' ? '높음' : 'High';
    } else if (level >= 0.4) {
      return language === 'ko' ? '보통' : 'Moderate';
    } else {
      return language === 'ko' ? '낮음' : 'Low';
    }
  };

  const getStressLevelColor = (level: number) => {
    if (level >= 0.8) return '#e74c3c';
    if (level >= 0.6) return '#e67e22';
    if (level >= 0.4) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="modal-title">
            {language === 'ko' ? '💆 휴식 시간이에요' : '💆 Time for a Break'}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="modal-body">
          {/* 스트레스 레벨 표시 */}
          <div className="stress-indicator">
            <div className="stress-label">
              {language === 'ko' ? '스트레스 레벨' : 'Stress Level'}
            </div>
            <div className="stress-bar-container">
              <div
                className="stress-bar"
                style={{
                  width: `${suggestion.stress_level * 100}%`,
                  backgroundColor: getStressLevelColor(suggestion.stress_level)
                }}
              />
            </div>
            <div
              className="stress-value"
              style={{ color: getStressLevelColor(suggestion.stress_level) }}
            >
              {getStressLevelText(suggestion.stress_level)}
            </div>
          </div>

          {/* 휴식 제안 이유 */}
          <div className="reason-container">
            <p className="reason-text">
              {language === 'ko' ? suggestion.reason_ko : suggestion.reason}
            </p>
          </div>

          {/* 추천 활동 목록 */}
          <div className="activities-container">
            <h3 className="activities-title">
              {language === 'ko' ? '추천 활동' : 'Recommended Activities'}
            </h3>
            <div className="activities-list">
              {suggestion.recommended_activities.map((activity) => (
                <div
                  key={activity.activity_id}
                  className={`activity-card ${
                    selectedActivity === activity.activity_id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedActivity(activity.activity_id)}
                >
                  <div className="activity-header">
                    <h4 className="activity-name">
                      {language === 'ko' ? activity.name_ko : activity.name}
                    </h4>
                    <span className="activity-duration">
                      {activity.duration_minutes}
                      {language === 'ko' ? '분' : ' min'}
                    </span>
                  </div>
                  <p className="activity-description">
                    {language === 'ko'
                      ? activity.description_ko
                      : activity.description}
                  </p>
                  <div className="activity-meta">
                    <span className="activity-type">{activity.break_type}</span>
                    <span className="activity-difficulty">
                      {activity.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 자동 진행 카운트다운 */}
          {countdown > 0 && (
            <div className="countdown-container">
              <p className="countdown-text">
                {language === 'ko'
                  ? `${countdown}초 후 자동으로 계속됩니다...`
                  : `Auto-continuing in ${countdown} seconds...`}
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            {language === 'ko' ? '나중에' : 'Later'}
          </button>
          <button
            className="button button-primary"
            onClick={handleAccept}
            disabled={!selectedActivity && suggestion.recommended_activities.length === 0}
          >
            {language === 'ko' ? '휴식하기' : 'Take a Break'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakSuggestionModal;
