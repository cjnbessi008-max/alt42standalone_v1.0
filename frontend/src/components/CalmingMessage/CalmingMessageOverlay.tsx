/**
 * CalmingMessageOverlay Component
 * Displays calming message with animation when students encounter difficult problems
 */

import React, { useState, useEffect, useRef } from 'react';
import { CalmingMessageConfig } from '../../types/calmingMessage';
import { BreathingAnimation } from './BreathingAnimation';
import './CalmingMessageOverlay.css';

interface CalmingMessageOverlayProps {
  problemId: string;
  studentId: string;
  moduleId: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  onComplete: () => void;
  config: CalmingMessageConfig;
}

export const CalmingMessageOverlay: React.FC<CalmingMessageOverlayProps> = ({
  problemId,
  studentId,
  moduleId,
  difficultyLevel,
  onComplete,
  config
}) => {
  const [audioFinished, setAudioFinished] = useState(false);
  const [remainingTime, setRemainingTime] = useState(config.timeout_seconds);
  const [userSkipped, setUserSkipped] = useState(false);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Should not show if disabled or below threshold
  const shouldShow = config.is_enabled && difficultyLevel >= config.difficulty_threshold;

  useEffect(() => {
    if (!shouldShow) {
      onComplete();
      return;
    }

    // Log interaction when component mounts
    logInteraction();
  }, [shouldShow]);

  // Auto-advance timer
  useEffect(() => {
    if (!shouldShow) return;

    if (audioFinished || userSkipped) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setRemainingTime(t => {
        if (t <= 1) {
          handleComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [audioFinished, userSkipped, shouldShow]);

  const logInteraction = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || '/api'}/modules/${moduleId}/interactions/calming_message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            problem_id: problemId,
            difficulty_level: difficultyLevel,
            message_type: config.audio_enabled ? 'combined' : 'visual'
          })
        }
      );

      const data = await response.json();
      setInteractionId(data.interaction_id);
    } catch (error) {
      console.error('Failed to log calming message interaction:', error);
    }
  };

  const updateInteraction = async (feedback?: boolean) => {
    if (!interactionId) return;

    const duration = (Date.now() - startTimeRef.current) / 1000;

    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || '/api'}/modules/${moduleId}/interactions/calming_message/${interactionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_viewed_seconds: duration,
            student_feedback: feedback,
            student_continued_immediately: userSkipped
          })
        }
      );
    } catch (error) {
      console.error('Failed to update interaction:', error);
    }
  };

  const handleComplete = async () => {
    await updateInteraction();
    onComplete();
  };

  const handleFeedback = async (helpful: boolean) => {
    await updateInteraction(helpful);
    setShowFeedback(false);
    onComplete();
  };

  const handleSkip = () => {
    setUserSkipped(true);
    setShowFeedback(true);
  };

  if (!shouldShow) {
    return null;
  }

  const message = config.message_templates[difficultyLevel] ||
    config.message_templates['4'] ||
    '깊게 숨을 쉬고 천천히 생각해보세요. 당신은 할 수 있습니다!';

  const audioUrl = `${process.env.REACT_APP_API_URL || '/api'}/modules/${moduleId}/audio/calming_message_${difficultyLevel}`;

  return (
    <div
      className="calming-message-overlay"
      role="dialog"
      aria-label="진정 메시지"
      aria-modal="true"
    >
      <div className="overlay-background" onClick={handleSkip} />

      <div className="message-container">
        {/* Breathing Animation */}
        <BreathingAnimation animationType={config.animation_type} />

        {/* Message Text */}
        {config.text_enabled && (
          <p className="calming-message-text" role="status" aria-live="polite">
            {message}
          </p>
        )}

        {/* Audio Player */}
        {config.audio_enabled && (
          <audio
            ref={audioRef}
            autoPlay
            onEnded={() => setAudioFinished(true)}
            onError={(e) => {
              console.error('Audio playback error:', e);
              setAudioFinished(true);
            }}
            style={{ display: 'none' }}
            aria-label="진정 메시지 오디오"
          >
            <source src={audioUrl} type="audio/mpeg" />
            브라우저가 오디오를 지원하지 않습니다.
          </audio>
        )}

        {/* Feedback Section */}
        {showFeedback ? (
          <div className="feedback-section" role="group" aria-label="피드백">
            <p className="feedback-question">이 메시지가 도움이 되었나요?</p>
            <div className="feedback-buttons">
              <button
                onClick={() => handleFeedback(true)}
                className="feedback-button helpful"
                aria-label="도움이 됨"
              >
                👍 네, 도움이 됐어요
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="feedback-button not-helpful"
                aria-label="도움이 안 됨"
              >
                👎 아니요
              </button>
            </div>
          </div>
        ) : (
          /* Continue Button */
          <button
            onClick={handleSkip}
            className="continue-button"
            aria-label={`계속하기 (${remainingTime}초 후 자동 진행)`}
          >
            계속하기 ({remainingTime}초)
          </button>
        )}

        {/* Accessibility: Screen reader text */}
        <div className="sr-only" role="status">
          {message}
        </div>
      </div>
    </div>
  );
};
