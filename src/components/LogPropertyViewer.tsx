import React, { useState, useEffect } from 'react';
import PropertyFlipCard from './PropertyFlipCard';
import { LogProperty } from '../types';
import { logProperties } from '../data/logProperties';

interface LogPropertyViewerProps {
  properties?: LogProperty[];
  autoPlayInterval?: number;
}

/**
 * Log Property Viewer Component
 * 여러 로그 성질 카드를 관리하고 네비게이션 제공
 */
const LogPropertyViewer: React.FC<LogPropertyViewerProps> = ({
  properties = logProperties,
  autoPlayInterval
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const currentProperty = properties[currentIndex];

  // 다음 카드로 이동
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % properties.length);
  };

  // 이전 카드로 이동
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
  };

  // 자동 재생
  useEffect(() => {
    if (isAutoPlay && autoPlayInterval) {
      const timer = setInterval(() => {
        handleNext();
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [isAutoPlay, autoPlayInterval, currentIndex]);

  // 카드 뒤집기 이벤트 핸들러
  const handleCardFlip = (isFlipped: boolean) => {
    console.log(`Card ${currentProperty.id} flipped:`, isFlipped);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PropertyFlipCard
        key={currentProperty.id}
        property={currentProperty}
        onFlip={handleCardFlip}
      />

      <div className="navigation-controls">
        <button
          className="nav-button"
          onClick={handlePrevious}
          disabled={properties.length <= 1}
          aria-label="이전 카드"
        >
          ← 이전
        </button>

        <button
          className="nav-button"
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          aria-label={isAutoPlay ? '자동재생 중지' : '자동재생 시작'}
          style={{
            background: isAutoPlay
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {isAutoPlay ? '⏸ 정지' : '▶ 자동'}
        </button>

        <button
          className="nav-button"
          onClick={handleNext}
          disabled={properties.length <= 1}
          aria-label="다음 카드"
        >
          다음 →
        </button>
      </div>

      <div className="progress-indicator">
        {currentIndex + 1} / {properties.length}
      </div>
    </div>
  );
};

export default LogPropertyViewer;
