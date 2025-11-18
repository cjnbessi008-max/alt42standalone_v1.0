/**
 * Refresh Routine Player Component
 * ================================
 * Full-screen player for 1-minute emotion refresh activities
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityContent,
  ActivityStep,
  EmotionType,
  StudentRating,
  CompleteSessionRequest,
  CompleteSessionResponse,
  EMOTION_LABELS,
  EMOTION_ICONS,
} from '../../types/emotion';
import { useEmotionState } from '../../hooks/useEmotionState';
import './RefreshRoutinePlayer.css';

interface RefreshRoutinePlayerProps {
  activity: ActivityContent;
  sessionId: string;
  studentId: string;
  preEmotionType: EmotionType;
  preEmotionScore: number;
  onComplete: (response: CompleteSessionResponse) => void;
  onClose: () => void;
}

/**
 * Refresh Routine Player
 *
 * Full-screen modal that:
 * - Displays activity steps with timer
 * - Shows visual cues and animations
 * - Allows pause/resume/skip
 * - Collects post-activity feedback
 */
export const RefreshRoutinePlayer: React.FC<RefreshRoutinePlayerProps> = ({
  activity,
  sessionId,
  studentId,
  preEmotionType,
  preEmotionScore,
  onComplete,
  onClose,
}) => {
  // State
  const [currentTime, setCurrentTime] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [postEmotion, setPostEmotion] = useState<EmotionType | null>(null);
  const [postScore, setPostScore] = useState(5);
  const [rating, setRating] = useState<StudentRating | null>(null);

  // Hooks
  const { completeSession, loading } = useEmotionState();

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Get current step
  const currentStep = activity.steps[currentStepIndex];

  // Start activity
  useEffect(() => {
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isPlaying && !isPaused && !isCompleted) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1;

          // Check if activity completed
          if (newTime >= activity.total_duration) {
            setIsCompleted(true);
            setIsPlaying(false);
            setShowFeedback(true);
            return activity.total_duration;
          }

          // Update step index
          const nextStepIndex = activity.steps.findIndex(
            (step) => step.time_seconds > newTime
          );
          if (nextStepIndex === -1) {
            setCurrentStepIndex(activity.steps.length - 1);
          } else {
            setCurrentStepIndex(Math.max(0, nextStepIndex - 1));
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, isCompleted, activity]);

  // Handlers
  const handlePause = useCallback(() => {
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setIsPlaying(true);
  }, []);

  const handleSkip = useCallback(() => {
    setIsCompleted(true);
    setIsPlaying(false);
    setShowFeedback(true);
  }, []);

  const handlePostEmotionSelect = useCallback((emotion: EmotionType) => {
    setPostEmotion(emotion);
  }, []);

  const handlePostScoreChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPostScore(Number(event.target.value));
    },
    []
  );

  const handleRatingClick = useCallback((ratingValue: StudentRating) => {
    setRating(ratingValue);
  }, []);

  const handleSubmitFeedback = useCallback(async () => {
    if (!postEmotion) {
      alert('활동 후 기분을 선택해주세요');
      return;
    }

    const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const completionPercentage = Math.min(
      100,
      Math.floor((currentTime / activity.total_duration) * 100)
    );

    const request: CompleteSessionRequest = {
      session_id: sessionId,
      post_emotion_type: postEmotion,
      post_emotion_score: postScore,
      completed: isCompleted,
      completion_percentage: completionPercentage,
      student_rating: rating || undefined,
      actual_duration_seconds: actualDuration,
    };

    try {
      const response = await completeSession(request);
      onComplete(response);
    } catch (err) {
      console.error('Failed to complete session:', err);
      alert('완료 처리 중 오류가 발생했습니다');
    }
  }, [
    postEmotion,
    postScore,
    rating,
    sessionId,
    currentTime,
    isCompleted,
    activity.total_duration,
    completeSession,
    onComplete,
  ]);

  // Calculate progress percentage
  const progressPercentage = (currentTime / activity.total_duration) * 100;
  const remainingTime = activity.total_duration - currentTime;

  // Render feedback screen
  if (showFeedback) {
    return (
      <div className="refresh-player-modal">
        <div className="refresh-player-container">
          <div className="refresh-player-feedback">
            <div className="feedback-header">
              <div className="feedback-icon">🎉</div>
              <h2>{isCompleted ? '잘했어요!' : '좋은 시도였어요!'}</h2>
              <p>{activity.encouragement}</p>
            </div>

            <div className="feedback-content">
              <h3>이제 기분이 어떤가요?</h3>

              {/* Post-emotion selector */}
              <div className="feedback-emotion-selector">
                {Object.values(EmotionType).map((emotion) => (
                  <button
                    key={emotion}
                    className={`feedback-emotion-button ${
                      postEmotion === emotion ? 'selected' : ''
                    }`}
                    onClick={() => handlePostEmotionSelect(emotion)}
                  >
                    <div className="feedback-emotion-icon">
                      {EMOTION_ICONS[emotion]}
                    </div>
                  </button>
                ))}
              </div>

              {/* Post-score slider */}
              {postEmotion && (
                <div className="feedback-score">
                  <label>감정 강도: {postScore}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={postScore}
                    onChange={handlePostScoreChange}
                    className="feedback-score-slider"
                  />
                </div>
              )}

              {/* Rating */}
              <div className="feedback-rating">
                <p>이 활동이 도움이 되었나요?</p>
                <div className="feedback-rating-buttons">
                  <button
                    className={`rating-button ${
                      rating === StudentRating.THUMBS_UP ? 'selected' : ''
                    }`}
                    onClick={() => handleRatingClick(StudentRating.THUMBS_UP)}
                  >
                    👍
                  </button>
                  <button
                    className={`rating-button ${
                      rating === StudentRating.THUMBS_DOWN ? 'selected' : ''
                    }`}
                    onClick={() => handleRatingClick(StudentRating.THUMBS_DOWN)}
                  >
                    👎
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                className="feedback-submit-button"
                onClick={handleSubmitFeedback}
                disabled={!postEmotion || loading}
              >
                {loading ? '제출 중...' : '학습 계속하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render activity player
  return (
    <div className="refresh-player-modal">
      <div className="refresh-player-container">
        {/* Close button */}
        <button className="refresh-player-close" onClick={onClose}>
          ✕
        </button>

        {/* Activity header */}
        <div className="refresh-player-header">
          <div className="activity-icon">🌊</div>
          <h2>{activity.title}</h2>
          <p>{activity.description}</p>
        </div>

        {/* Visual area */}
        <div className="refresh-player-visual">
          <div className={`visual-animation visual-${currentStep?.visual_cue || 'relax'}`}>
            <div className="visual-circle"></div>
          </div>
        </div>

        {/* Instruction */}
        <div className="refresh-player-instruction">
          <p>{currentStep?.instruction || '준비하세요...'}</p>
        </div>

        {/* Progress bar */}
        <div className="refresh-player-progress">
          <div
            className="progress-bar"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Timer */}
        <div className="refresh-player-timer">{remainingTime}초 남음</div>

        {/* Controls */}
        <div className="refresh-player-controls">
          <button className="control-button" onClick={() => setIsPlaying(false)}>
            🔇
          </button>

          {isPaused ? (
            <button className="control-button" onClick={handleResume}>
              ▶️
            </button>
          ) : (
            <button className="control-button" onClick={handlePause}>
              ⏸️
            </button>
          )}

          <button className="control-button" onClick={handleSkip}>
            ⏭️
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefreshRoutinePlayer;
