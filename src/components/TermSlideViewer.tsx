/**
 * TermSlideViewer Component
 * Container for term slides with navigation and progress indicator
 */

import React from 'react';
import { Term, SlideDirection } from '@/types';
import { TermSlide } from './TermSlide';
import './TermSlideViewer.css';

interface TermSlideViewerProps {
  terms: Term[];
  currentIndex: number;
  direction: SlideDirection;
  onNext?: () => void;
  onPrevious?: () => void;
  showProgress?: boolean;
  progress?: number;
}

export const TermSlideViewer: React.FC<TermSlideViewerProps> = ({
  terms,
  currentIndex,
  direction,
  onNext,
  onPrevious,
  showProgress = true,
  progress = 0,
}) => {
  const currentTerm = terms[currentIndex];

  if (!currentTerm) {
    return (
      <div className="term-slide-viewer">
        <div className="no-terms-message">
          <p>문제가 없습니다.</p>
          <p className="no-terms-subtitle">Moodle에서 문제를 불러오세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="term-slide-viewer">
      {showProgress && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <div className="progress-text">
            {currentIndex + 1} / {terms.length}
          </div>
        </div>
      )}

      <div className="term-slide-container">
        <TermSlide
          term={currentTerm}
          direction={direction}
          isActive={true}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      </div>
    </div>
  );
};

export default TermSlideViewer;
