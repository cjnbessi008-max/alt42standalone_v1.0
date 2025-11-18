/**
 * Distraction Indicator - Automatic Display Component
 *
 * Automatically detects and displays distraction points for students
 *
 * Features:
 * - Real-time focus status indicator
 * - Visual alerts when distractions are detected
 * - Timeline view of distraction events
 * - Automatic marking of distraction points on learning timeline
 * - Break recommendations
 * - Focus improvement suggestions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDistractionTracker, DistractionEvent } from '../../lib/DistractionTracker';

// ============================================================================
// Types
// ============================================================================

interface DistractionIndicatorProps {
  studentId: string;
  moduleId: string;
  sessionId: string;
  problemId?: string;
  problemContext?: Record<string, any>;
  apiEndpoint: string;
  showTimeline?: boolean;
  showAlerts?: boolean;
  showFocusStatus?: boolean;
  onDistractionDetected?: (event: DistractionEvent) => void;
}

interface FocusStatus {
  isFocused: boolean;
  focusDurationSeconds: number;
  lastDistractionTime: Date | null;
  consecutiveDistractions: number;
}

interface DistractionPoint {
  timestamp: Date;
  type: string;
  duration: number;
  severity: string;
  marked: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const DistractionIndicator: React.FC<DistractionIndicatorProps> = ({
  studentId,
  moduleId,
  sessionId,
  problemId,
  problemContext = {},
  apiEndpoint,
  showTimeline = true,
  showAlerts = true,
  showFocusStatus = true,
  onDistractionDetected,
}) => {
  const [distractionEvents, setDistractionEvents] = useState<DistractionEvent[]>([]);
  const [focusStatus, setFocusStatus] = useState<FocusStatus>({
    isFocused: true,
    focusDurationSeconds: 0,
    lastDistractionTime: null,
    consecutiveDistractions: 0,
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [sessionStartTime] = useState(new Date());

  // Initialize distraction tracker
  const { tracker, isTracking } = useDistractionTracker({
    studentId,
    moduleId,
    sessionId,
    problemId,
    problemContext,
    apiEndpoint,
    autoStart: true,
    debug: process.env.NODE_ENV === 'development',
    onEventDetected: handleEventDetected,
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================

  function handleEventDetected(event: DistractionEvent) {
    console.log('Distraction detected:', event);

    // Add to local events list
    setDistractionEvents((prev) => [...prev, event]);

    // Update focus status
    setFocusStatus((prev) => {
      const consecutive = prev.consecutiveDistractions + 1;

      return {
        isFocused: false,
        focusDurationSeconds: 0,
        lastDistractionTime: new Date(event.eventTimestamp),
        consecutiveDistractions: consecutive,
      };
    });

    // Show alert for major/critical distractions
    if (event.severityLevel === 'major' || event.severityLevel === 'critical') {
      showDistractionAlert(event);
    }

    // Notify parent component
    if (onDistractionDetected) {
      onDistractionDetected(event);
    }

    // Reset focus status after a short delay
    setTimeout(() => {
      setFocusStatus((prev) => ({
        ...prev,
        isFocused: true,
        focusDurationSeconds: 0,
      }));
    }, 5000);
  }

  function showDistractionAlert(event: DistractionEvent) {
    const messages: Record<string, string> = {
      page_blur: '화면이 비활성화되었습니다. 집중해주세요!',
      tab_switch: '다른 탭으로 전환했습니다. 학습에 집중해주세요!',
      inactivity: '활동이 감지되지 않았습니다. 휴식이 필요하신가요?',
      mouse_idle: '마우스 활동이 없습니다.',
      keyboard_idle: '키보드 활동이 없습니다.',
    };

    setAlertMessage(messages[event.eventType] || '산만함이 감지되었습니다.');
    setShowAlert(true);

    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  }

  // ============================================================================
  // Focus Time Tracking
  // ============================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusStatus((prev) => {
        if (prev.isFocused) {
          return {
            ...prev,
            focusDurationSeconds: prev.focusDurationSeconds + 1,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const distractionPoints = useMemo(() => {
    return distractionEvents.map((event) => ({
      timestamp: new Date(event.eventTimestamp),
      type: event.eventType,
      duration: event.durationSeconds,
      severity: event.severityLevel,
      marked: true, // All detected events are automatically marked
    }));
  }, [distractionEvents]);

  const totalDistractionTime = useMemo(() => {
    return distractionEvents.reduce((sum, event) => sum + event.durationSeconds, 0);
  }, [distractionEvents]);

  const sessionDuration = useMemo(() => {
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
  }, [sessionStartTime]);

  const distractionPercentage = useMemo(() => {
    if (sessionDuration === 0) return 0;
    return Math.round((totalDistractionTime / sessionDuration) * 100);
  }, [totalDistractionTime, sessionDuration]);

  const focusLevel = useMemo(() => {
    if (distractionPercentage < 10) return 'excellent';
    if (distractionPercentage < 25) return 'good';
    if (distractionPercentage < 50) return 'fair';
    return 'poor';
  }, [distractionPercentage]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="distraction-indicator">
      {/* Focus Status Indicator */}
      {showFocusStatus && (
        <FocusStatusBadge
          isFocused={focusStatus.isFocused}
          focusDurationSeconds={focusStatus.focusDurationSeconds}
          focusLevel={focusLevel}
          distractionPercentage={distractionPercentage}
        />
      )}

      {/* Real-time Alert */}
      {showAlerts && showAlert && (
        <DistractionAlert message={alertMessage} onClose={() => setShowAlert(false)} />
      )}

      {/* Distraction Timeline */}
      {showTimeline && distractionPoints.length > 0 && (
        <DistractionTimeline
          points={distractionPoints}
          sessionStartTime={sessionStartTime}
          sessionDuration={sessionDuration}
        />
      )}

      {/* Break Recommendation */}
      {focusStatus.consecutiveDistractions >= 3 && (
        <BreakRecommendation onTakeBreak={() => {}} />
      )}
    </div>
  );
};

// ============================================================================
// Focus Status Badge Component
// ============================================================================

const FocusStatusBadge: React.FC<{
  isFocused: boolean;
  focusDurationSeconds: number;
  focusLevel: string;
  distractionPercentage: number;
}> = ({ isFocused, focusDurationSeconds, focusLevel, distractionPercentage }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getFocusColor = () => {
    if (focusLevel === 'excellent') return '#22c55e';
    if (focusLevel === 'good') return '#84cc16';
    if (focusLevel === 'fair') return '#facc15';
    return '#ef4444';
  };

  const getFocusIcon = () => {
    if (focusLevel === 'excellent') return '🎯';
    if (focusLevel === 'good') return '😊';
    if (focusLevel === 'fair') return '😐';
    return '😟';
  };

  return (
    <div className="focus-status-badge" style={{ borderColor: getFocusColor() }}>
      <div className="focus-icon">{isFocused ? '✓' : '⚠'}</div>
      <div className="focus-info">
        <div className="focus-label">
          {isFocused ? '집중 중' : '산만함 감지'} {getFocusIcon()}
        </div>
        <div className="focus-time">집중 시간: {formatTime(focusDurationSeconds)}</div>
        <div className="distraction-percentage" style={{ color: getFocusColor() }}>
          산만함: {distractionPercentage}%
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Distraction Alert Component
// ============================================================================

const DistractionAlert: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  return (
    <div className="distraction-alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-message">{message}</div>
      <button className="alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// ============================================================================
// Distraction Timeline Component
// ============================================================================

const DistractionTimeline: React.FC<{
  points: DistractionPoint[];
  sessionStartTime: Date;
  sessionDuration: number;
}> = ({ points, sessionStartTime, sessionDuration }) => {
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      major: '#ea580c',
      moderate: '#facc15',
      minor: '#22c55e',
    };
    return colors[severity] || '#6b7280';
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      page_blur: '👁️',
      tab_switch: '🔄',
      mouse_idle: '🖱️',
      keyboard_idle: '⌨️',
      inactivity: '💤',
      window_resize: '📐',
      copy_paste: '📋',
      devtools_open: '🛠️',
    };
    return icons[type] || '⚠️';
  };

  const getPosition = (timestamp: Date) => {
    const elapsed = timestamp.getTime() - sessionStartTime.getTime();
    const percentage = (elapsed / (sessionDuration * 1000)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  return (
    <div className="distraction-timeline">
      <div className="timeline-header">
        <h4>산만함 타임라인</h4>
        <span className="timeline-count">{points.length}개 이벤트</span>
      </div>
      <div className="timeline-bar">
        <div className="timeline-track" />
        {points.map((point, index) => (
          <div
            key={index}
            className="timeline-point"
            style={{
              left: `${getPosition(point.timestamp)}%`,
              backgroundColor: getSeverityColor(point.severity),
            }}
            title={`${point.type} - ${point.duration}초 (${point.severity})`}
          >
            <span className="point-icon">{getEventIcon(point.type)}</span>
          </div>
        ))}
      </div>
      <div className="timeline-labels">
        <span>시작</span>
        <span>현재</span>
      </div>
    </div>
  );
};

// ============================================================================
// Break Recommendation Component
// ============================================================================

const BreakRecommendation: React.FC<{
  onTakeBreak: () => void;
}> = ({ onTakeBreak }) => {
  return (
    <div className="break-recommendation">
      <div className="recommendation-icon">☕</div>
      <div className="recommendation-content">
        <h4>휴식을 권장합니다</h4>
        <p>연속적인 산만함이 감지되었습니다. 잠시 휴식을 취하시겠어요?</p>
        <button className="take-break-button" onClick={onTakeBreak}>
          5분 휴식하기
        </button>
      </div>
    </div>
  );
};

export default DistractionIndicator;
