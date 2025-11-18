/**
 * Emotion Check-In Widget Component
 * =================================
 * Main widget for students to check in their emotional state
 */

import React, { useState, useCallback } from 'react';
import {
  EmotionType,
  EMOTION_LABELS,
  EMOTION_ICONS,
  EmotionCheckInRequest,
  EmotionCheckInResponse,
} from '../../types/emotion';
import { useEmotionState } from '../../hooks/useEmotionState';
import './EmotionCheckInWidget.css';

interface EmotionCheckInWidgetProps {
  studentId: string;
  moduleId?: string;
  sessionDurationMinutes?: number;
  onCheckInComplete?: (response: EmotionCheckInResponse) => void;
  onActivitySuggested?: (activityId: string, response: EmotionCheckInResponse) => void;
}

/**
 * Emotion Check-In Widget
 *
 * Displays a floating button that expands to allow students to:
 * - Select their current emotion
 * - Rate emotion intensity (1-10)
 * - Optionally add a note
 * - Submit check-in
 */
export const EmotionCheckInWidget: React.FC<EmotionCheckInWidgetProps> = ({
  studentId,
  moduleId,
  sessionDurationMinutes,
  onCheckInComplete,
  onActivitySuggested,
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [emotionScore, setEmotionScore] = useState<number>(5);
  const [contextNote, setContextNote] = useState('');

  // Hooks
  const { checkIn, loading, error, clearError } = useEmotionState();

  // Handlers
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    if (!isExpanded) {
      // Reset form when opening
      setSelectedEmotion(null);
      setEmotionScore(5);
      setContextNote('');
      clearError();
    }
  }, [isExpanded, clearError]);

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setSelectedEmotion(emotion);
  }, []);

  const handleScoreChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmotionScore(Number(event.target.value));
  }, []);

  const handleNoteChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContextNote(event.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedEmotion) {
      alert('감정을 선택해주세요');
      return;
    }

    const request: EmotionCheckInRequest = {
      student_id: studentId,
      module_id: moduleId,
      emotion_type: selectedEmotion,
      emotion_score: emotionScore,
      context_note: contextNote || undefined,
      session_duration_minutes: sessionDurationMinutes,
    };

    try {
      const response = await checkIn(request);

      // Collapse widget
      setIsExpanded(false);

      // Call callback
      if (onCheckInComplete) {
        onCheckInComplete(response);
      }

      // If activity suggested, call callback
      if (response.suggested_activity_id && onActivitySuggested) {
        onActivitySuggested(response.suggested_activity_id, response);
      }

      // Show message
      alert(response.message);
    } catch (err) {
      // Error already set in hook
      console.error('Check-in failed:', err);
    }
  }, [
    selectedEmotion,
    emotionScore,
    contextNote,
    studentId,
    moduleId,
    sessionDurationMinutes,
    checkIn,
    onCheckInComplete,
    onActivitySuggested,
  ]);

  const handleCancel = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Render
  if (!isExpanded) {
    // Collapsed state - floating button
    return (
      <div className="emotion-widget-collapsed">
        <button
          className="emotion-widget-button"
          onClick={handleToggle}
          aria-label="기분 체크인"
        >
          🙂 기분?
        </button>
      </div>
    );
  }

  // Expanded state - full form
  return (
    <div className="emotion-widget-expanded">
      <div className="emotion-widget-header">
        <h3>지금 기분이 어때요?</h3>
        <button
          className="emotion-widget-close"
          onClick={handleToggle}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="emotion-widget-error">
          {error}
        </div>
      )}

      <div className="emotion-widget-content">
        {/* Emotion selector */}
        <div className="emotion-selector">
          {Object.values(EmotionType).map((emotion) => (
            <button
              key={emotion}
              className={`emotion-button ${
                selectedEmotion === emotion ? 'selected' : ''
              }`}
              onClick={() => handleEmotionSelect(emotion)}
              disabled={loading}
              aria-label={EMOTION_LABELS[emotion]}
            >
              <div className="emotion-icon">{EMOTION_ICONS[emotion]}</div>
              <div className="emotion-label">{EMOTION_LABELS[emotion]}</div>
            </button>
          ))}
        </div>

        {/* Score slider */}
        {selectedEmotion && (
          <div className="emotion-score">
            <label htmlFor="emotion-score-slider">
              감정 강도: {emotionScore}/10
            </label>
            <input
              id="emotion-score-slider"
              type="range"
              min="1"
              max="10"
              value={emotionScore}
              onChange={handleScoreChange}
              disabled={loading}
              className="emotion-score-slider"
            />
            <div className="emotion-score-labels">
              <span>약함</span>
              <span>강함</span>
            </div>
          </div>
        )}

        {/* Optional note */}
        <div className="emotion-note">
          <label htmlFor="context-note">메모 (선택사항):</label>
          <textarea
            id="context-note"
            value={contextNote}
            onChange={handleNoteChange}
            placeholder="무엇 때문인지 적어보세요..."
            maxLength={500}
            rows={3}
            disabled={loading}
            className="emotion-note-input"
          />
          <div className="emotion-note-count">
            {contextNote.length}/500
          </div>
        </div>

        {/* Action buttons */}
        <div className="emotion-widget-actions">
          <button
            className="emotion-button-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            나중에
          </button>
          <button
            className="emotion-button-primary"
            onClick={handleSubmit}
            disabled={!selectedEmotion || loading}
          >
            {loading ? '체크인 중...' : '체크인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmotionCheckInWidget;
