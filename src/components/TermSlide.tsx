/**
 * TermSlide Component
 * Displays a single term with smooth slide animation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Term, SlideDirection } from '@/types';
import './TermSlide.css';

interface TermSlideProps {
  term: Term;
  direction: SlideDirection;
  isActive: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const TermSlide: React.FC<TermSlideProps> = ({
  term,
  direction,
  isActive,
  onNext,
  onPrevious,
}) => {
  const getSlideVariants = () => {
    const distance = 100;

    const directionOffsets = {
      left: { x: -distance, y: 0 },
      right: { x: distance, y: 0 },
      up: { x: 0, y: -distance },
      down: { x: 0, y: distance },
    };

    const offset = directionOffsets[direction];

    return {
      enter: {
        x: offset.x,
        y: offset.y,
        opacity: 0,
      },
      center: {
        x: 0,
        y: 0,
        opacity: 1,
      },
      exit: {
        x: -offset.x,
        y: -offset.y,
        opacity: 0,
      },
    };
  };

  const variants = getSlideVariants();

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={term.id}
          className="term-slide"
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1], // Custom easing curve
          }}
        >
          <div className="term-content">
            {term.imageUrl && (
              <div className="term-image">
                <img src={term.imageUrl} alt={term.title} />
              </div>
            )}

            <h2 className="term-title">{term.title}</h2>

            {term.description && (
              <p className="term-description">{term.description}</p>
            )}

            <div className="term-body">
              {term.content}
            </div>

            {term.metadata && (
              <div className="term-metadata">
                {Object.entries(term.metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}:</span>
                    <span className="metadata-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="term-navigation">
            {onPrevious && (
              <button
                className="nav-button nav-previous"
                onClick={onPrevious}
                aria-label="Previous term"
              >
                ← 이전
              </button>
            )}

            {onNext && (
              <button
                className="nav-button nav-next"
                onClick={onNext}
                aria-label="Next term"
              >
                다음 →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermSlide;
