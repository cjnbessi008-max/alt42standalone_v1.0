/**
 * Mind Wandering Alert Component
 *
 * Displays gentle interventions when mind wandering is detected
 */
import React, { useEffect, useState } from 'react';
import './MindWanderingAlert.css';

interface MindWanderingAlertProps {
  type: 'gentle_reminder' | 'focus_reminder' | 'break_suggestion' | 'help_offer';
  message: string;
  messageEn?: string;
  confidence: number;
  onDismiss: () => void;
  onResponse?: (response: string) => void;
}

export const MindWanderingAlert: React.FC<MindWanderingAlertProps> = ({
  type,
  message,
  messageEn,
  confidence,
  onDismiss,
  onResponse
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 10 seconds if not interacted with
    const timer = setTimeout(() => {
      handleDismiss('auto_dismissed');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (response: string = 'dismissed') => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
      if (onResponse) {
        onResponse(response);
      }
    }, 300); // Wait for fade out animation
  };

  const getIcon = () => {
    switch (type) {
      case 'break_suggestion':
        return '☕';
      case 'focus_reminder':
        return '🎯';
      case 'help_offer':
        return '🤝';
      default:
        return '✨';
    }
  };

  const getActionButtons = () => {
    switch (type) {
      case 'break_suggestion':
        return (
          <>
            <button
              className="mw-alert-button primary"
              onClick={() => handleDismiss('took_break')}
            >
              {language === 'ko' ? '휴식하기' : 'Take a Break'}
            </button>
            <button
              className="mw-alert-button secondary"
              onClick={() => handleDismiss('resumed')}
            >
              {language === 'ko' ? '계속하기' : 'Continue'}
            </button>
          </>
        );

      case 'help_offer':
        return (
          <>
            <button
              className="mw-alert-button primary"
              onClick={() => handleDismiss('requested_help')}
            >
              {language === 'ko' ? '도움 요청' : 'Get Help'}
            </button>
            <button
              className="mw-alert-button secondary"
              onClick={() => handleDismiss('no_help_needed')}
            >
              {language === 'ko' ? '괜찮아요' : "I'm OK"}
            </button>
          </>
        );

      default:
        return (
          <button
            className="mw-alert-button primary"
            onClick={() => handleDismiss('resumed')}
          >
            {language === 'ko' ? '알겠습니다' : 'Got it'}
          </button>
        );
    }
  };

  return (
    <div className={`mw-alert-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`mw-alert-container ${type}`}>
        <div className="mw-alert-header">
          <span className="mw-alert-icon">{getIcon()}</span>
          <button
            className="mw-alert-language-toggle"
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          >
            {language === 'ko' ? 'EN' : '한글'}
          </button>
        </div>

        <div className="mw-alert-content">
          <p className="mw-alert-message">
            {language === 'ko' ? message : (messageEn || message)}
          </p>

          {confidence >= 0.8 && (
            <p className="mw-alert-subtitle">
              {language === 'ko'
                ? '잠시 집중력이 흐트러진 것 같아요'
                : 'It seems you might have lost focus for a moment'}
            </p>
          )}
        </div>

        <div className="mw-alert-actions">
          {getActionButtons()}
        </div>

        <div className="mw-alert-footer">
          <span className="mw-alert-confidence">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
