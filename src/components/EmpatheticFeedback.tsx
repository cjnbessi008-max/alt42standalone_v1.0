/**
 * EmpatheticFeedback Component
 *
 * A React component that displays supportive, encouraging feedback messages
 * for student learning interactions in LMS applications
 *
 * Features:
 * - Warm, encouraging visual design
 * - Animated entrance
 * - Support for both Korean and English
 * - Context-aware personalization
 * - Accessibility compliant (WCAG 2.1 AA)
 */

import React, { useEffect, useState } from 'react';
import {
  getEmpatheticFeedback,
  getFeedbackForAnswer,
  FeedbackType,
  Language,
  FeedbackContext,
  FeedbackMessage,
} from '../lib/empathetic-feedback';

export interface EmpatheticFeedbackProps {
  /** Type of feedback to display */
  type?: FeedbackType;
  /** Is the answer correct? (alternative to type) */
  isCorrect?: boolean;
  /** Number of attempts made */
  attemptNumber?: number;
  /** Language preference */
  language?: Language;
  /** Additional context for personalization */
  context?: FeedbackContext;
  /** Show/hide the feedback */
  visible?: boolean;
  /** Callback when feedback is shown */
  onShow?: () => void;
  /** Auto-hide after N milliseconds (0 = don't auto-hide) */
  autoHideDuration?: number;
  /** Callback when feedback is hidden */
  onHide?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main EmpatheticFeedback Component
 */
export const EmpatheticFeedback: React.FC<EmpatheticFeedbackProps> = ({
  type,
  isCorrect,
  attemptNumber = 1,
  language = 'ko',
  context = {},
  visible = true,
  onShow,
  autoHideDuration = 0,
  onHide,
  className = '',
}) => {
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isVisible, setIsVisible] = useState(visible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      // Generate feedback message
      let newFeedback: FeedbackMessage;

      if (type) {
        newFeedback = getEmpatheticFeedback(type, language, context);
      } else if (isCorrect !== undefined) {
        newFeedback = getFeedbackForAnswer(isCorrect, attemptNumber, context, language);
      } else {
        // Default to encouragement
        newFeedback = getEmpatheticFeedback('encouragement', language, context);
      }

      setFeedback(newFeedback);
      setIsVisible(true);
      setIsAnimating(true);

      // Trigger onShow callback
      onShow?.();

      // Auto-hide if duration is set
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onHide?.();
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [visible, type, isCorrect, attemptNumber, language, context, onShow, autoHideDuration, onHide]);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  if (!isVisible || !feedback) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        empathetic-feedback
        ${feedback.color}
        ${isAnimating ? 'animate-slide-in' : ''}
        rounded-lg
        border-2
        p-4
        mb-4
        shadow-lg
        transition-all
        duration-300
        ${className}
      `}
      style={{
        animation: isAnimating ? 'slideIn 0.5s ease-out' : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <FeedbackIcon type={type || (isCorrect ? 'correct' : 'wrong')} />
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <p className="text-lg font-medium leading-relaxed">{feedback.text}</p>
        </div>

        {/* Emoji (if present) */}
        {feedback.emoji && (
          <div className="flex-shrink-0 text-3xl" aria-hidden="true">
            {feedback.emoji}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Icon component based on feedback type
 */
const FeedbackIcon: React.FC<{ type: FeedbackType }> = ({ type }) => {
  const iconProps = {
    className: 'w-6 h-6',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
  };

  switch (type) {
    case 'correct':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" aria-label="Success">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );

    case 'partial':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" aria-label="Partial">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );

    case 'encouragement':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" aria-label="Encouragement">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );

    case 'wrong':
    default:
      return (
        <svg {...iconProps} viewBox="0 0 24 24" aria-label="Info">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
};

/**
 * Compact version for inline display
 */
export const CompactFeedback: React.FC<EmpatheticFeedbackProps> = (props) => {
  return <EmpatheticFeedback {...props} className={`py-2 px-3 text-sm ${props.className || ''}`} />;
};

/**
 * Toast-style feedback (appears at top/bottom of screen)
 */
export const ToastFeedback: React.FC<EmpatheticFeedbackProps & { position?: 'top' | 'bottom' }> = ({
  position = 'top',
  ...props
}) => {
  return (
    <div
      className={`
        fixed
        ${position === 'top' ? 'top-4' : 'bottom-4'}
        left-1/2
        transform
        -translate-x-1/2
        z-50
        w-full
        max-w-md
        px-4
      `}
    >
      <EmpatheticFeedback {...props} />
    </div>
  );
};

/**
 * CSS Animations (inject into page or use with CSS-in-JS)
 */
export const feedbackStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-in {
    animation: slideIn 0.5s ease-out;
  }

  /* Tailwind-style color utilities if not using Tailwind */
  .bg-green-50 { background-color: #f0fdf4; }
  .text-green-800 { color: #166534; }
  .border-green-200 { border-color: #bbf7d0; }

  .bg-yellow-50 { background-color: #fefce8; }
  .text-yellow-800 { color: #854d0e; }
  .border-yellow-200 { border-color: #fef08a; }

  .bg-orange-50 { background-color: #fff7ed; }
  .text-orange-800 { color: #9a3412; }
  .border-orange-200 { border-color: #fed7aa; }

  .bg-blue-50 { background-color: #eff6ff; }
  .text-blue-800 { color: #1e40af; }
  .border-blue-200 { border-color: #bfdbfe; }
`;

export default EmpatheticFeedback;
