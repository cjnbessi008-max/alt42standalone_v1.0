import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlipDetection } from '../hooks/useFlipDetection';
import { useVisualEffects } from '../hooks/useVisualEffects';
import '../styles/VirtualSmartphone.css';

interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
}

interface VirtualSmartphoneProps {
  moodleApiUrl?: string;
  questionId?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Virtual Smartphone Component
 * Displays a simulated mobile device in the corner of the screen
 * with Flip Moment visual effects
 */
export const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({
  moodleApiUrl = '/api/moodle/questions',
  questionId,
  position = 'bottom-right',
  size = 'medium',
}) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flip detection
  const { orientation, flipDirection, isFlipping, flipCount } = useFlipDetection({
    onFlip: (direction, newOrientation) => {
      console.log(`Flip detected: ${direction} -> ${newOrientation}`);
    },
  });

  // Visual effects based on flip state
  const { filterStyle, transformStyle, transitionDuration } = useVisualEffects(
    flipDirection,
    orientation,
    isFlipping,
    {
      enableColorInversion: true,
      enableRotation: true,
      enableScaling: true,
      enableFilterEffects: true,
      transitionDuration: 600,
    }
  );

  // Fetch question from Moodle API
  useEffect(() => {
    if (questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId]);

  const fetchQuestion = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${moodleApiUrl}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }
      const data = await response.json();
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching question:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPositionClass = () => {
    return `smartphone-${position}`;
  };

  const getSizeClass = () => {
    return `smartphone-${size}`;
  };

  return (
    <div className={`virtual-smartphone-container ${getPositionClass()}`}>
      <motion.div
        className={`virtual-smartphone ${getSizeClass()}`}
        style={{
          filter: filterStyle,
          transform: transformStyle,
          transition: `all ${transitionDuration}ms ease-in-out`,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        {/* Phone frame */}
        <div className="smartphone-frame">
          {/* Notch */}
          <div className="smartphone-notch" />

          {/* Screen */}
          <div className="smartphone-screen">
            {/* Status bar */}
            <div className="smartphone-statusbar">
              <span className="time">9:41</span>
              <div className="status-icons">
                <span className="signal">📶</span>
                <span className="battery">🔋</span>
              </div>
            </div>

            {/* Content area */}
            <div className="smartphone-content">
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner" />
                  <p>Loading question...</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <p>⚠️ {error}</p>
                </div>
              )}

              {question && !loading && (
                <div className="question-container">
                  <h3 className="question-title">Question {question.id}</h3>
                  <p className="question-text">{question.text}</p>

                  {question.options && (
                    <div className="question-options">
                      {question.options.map((option, index) => (
                        <button
                          key={index}
                          className="option-button"
                          onClick={() => console.log(`Selected: ${option}`)}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!question && !loading && !error && (
                <div className="placeholder">
                  <p>🎓</p>
                  <p>No question loaded</p>
                  <p className="hint">Connect to Moodle to see questions</p>
                </div>
              )}
            </div>

            {/* Flip indicator */}
            <AnimatePresence>
              {isFlipping && (
                <motion.div
                  className="flip-indicator"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="flip-icon">🔄</span>
                  <span className="flip-text">
                    Flip Moment! ({flipDirection})
                  </span>
                  <span className="flip-count">
                    Count: {flipCount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Home indicator */}
            <div className="smartphone-home-indicator" />
          </div>
        </div>
      </motion.div>

      {/* Debug info */}
      <div className="debug-info">
        <small>
          Orientation: {orientation} | Flipping: {isFlipping ? 'Yes' : 'No'}
        </small>
      </div>
    </div>
  );
};
