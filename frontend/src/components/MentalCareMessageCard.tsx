/**
 * Mental Care Message Card Component
 * Displays mental care messages to students with bilingual support
 */

import React, { useState } from 'react';
import { MentalCareMessage, MessageType, MessageSeverity } from '../types/mental-care.types';
import mentalCareService from '../services/mental-care.service';
import './MentalCareMessageCard.css';

interface MentalCareMessageCardProps {
  message: MentalCareMessage;
  language?: 'ko' | 'en';
  onClose?: () => void;
  showFeedback?: boolean;
  studentId?: string;
}

const MentalCareMessageCard: React.FC<MentalCareMessageCardProps> = ({
  message,
  language = 'ko',
  onClose,
  showFeedback = true,
  studentId,
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messageText = language === 'ko' ? message.text_ko : message.text_en;

  const getMessageIcon = (type: MessageType): string => {
    switch (type) {
      case MessageType.ENCOURAGEMENT:
        return '💪';
      case MessageType.BREAK_SUGGESTION:
        return '☕';
      case MessageType.STRATEGY_TIP:
        return '💡';
      case MessageType.CELEBRATION:
        return '🎉';
      default:
        return '😊';
    }
  };

  const getSeverityColor = (severity: MessageSeverity): string => {
    switch (severity) {
      case MessageSeverity.HIGH:
        return '#ff6b6b';
      case MessageSeverity.MEDIUM:
        return '#ffd93d';
      case MessageSeverity.LOW:
        return '#6bcf7f';
      default:
        return '#95a5a6';
    }
  };

  const handleFeedback = async (reaction: 'helpful' | 'not_helpful' | 'neutral') => {
    if (!studentId) return;

    try {
      await mentalCareService.submitMessageFeedback(
        message.message_id,
        studentId,
        reaction
      );
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div
      className="mental-care-message-card"
      style={{ borderLeftColor: getSeverityColor(message.severity) }}
    >
      <div className="message-header">
        <span className="message-icon">{getMessageIcon(message.message_type)}</span>
        <span className="message-type">
          {language === 'ko' ? getTypeNameKo(message.message_type) : message.message_type}
        </span>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="message-body">
        <p className="message-text">{messageText}</p>
      </div>

      {message.recommended_actions && message.recommended_actions.length > 0 && (
        <div className="recommended-actions">
          {message.recommended_actions.map((action, index) => (
            <span key={index} className="action-tag">
              {getActionText(action, language)}
            </span>
          ))}
        </div>
      )}

      {showFeedback && !feedbackSubmitted && (
        <div className="feedback-section">
          <p className="feedback-prompt">
            {language === 'ko' ? '이 메시지가 도움이 되었나요?' : 'Was this message helpful?'}
          </p>
          <div className="feedback-buttons">
            <button
              className="feedback-button helpful"
              onClick={() => handleFeedback('helpful')}
              aria-label="Helpful"
            >
              👍 {language === 'ko' ? '도움됨' : 'Helpful'}
            </button>
            <button
              className="feedback-button neutral"
              onClick={() => handleFeedback('neutral')}
              aria-label="Neutral"
            >
              😐 {language === 'ko' ? '보통' : 'Neutral'}
            </button>
            <button
              className="feedback-button not-helpful"
              onClick={() => handleFeedback('not_helpful')}
              aria-label="Not helpful"
            >
              👎 {language === 'ko' ? '별로' : 'Not helpful'}
            </button>
          </div>
        </div>
      )}

      {feedbackSubmitted && (
        <div className="feedback-submitted">
          <p>{language === 'ko' ? '피드백 감사합니다!' : 'Thank you for your feedback!'}</p>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getTypeNameKo(type: MessageType): string {
  switch (type) {
    case MessageType.ENCOURAGEMENT:
      return '격려';
    case MessageType.BREAK_SUGGESTION:
      return '휴식 제안';
    case MessageType.STRATEGY_TIP:
      return '전략 팁';
    case MessageType.CELEBRATION:
      return '축하';
    default:
      return '메시지';
  }
}

function getActionText(action: string, language: 'ko' | 'en'): string {
  const actionTexts: Record<string, { ko: string; en: string }> = {
    encourage: { ko: '격려', en: 'Encourage' },
    suggest_break: { ko: '휴식 권장', en: 'Take a break' },
    suggest_strategy: { ko: '전략 제안', en: 'Strategy tip' },
    offer_help: { ko: '도움 요청', en: 'Get help' },
    offer_hint: { ko: '힌트 사용', en: 'Use hint' },
  };

  return actionTexts[action]?.[language] || action;
}

export default MentalCareMessageCard;
