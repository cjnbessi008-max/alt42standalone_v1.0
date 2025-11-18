import React, { useState } from 'react';
import { LogProperty } from '../types';
import '../styles/FlipCard.css';

interface PropertyFlipCardProps {
  property: LogProperty;
  onFlip?: (isFlipped: boolean) => void;
}

/**
 * Property Flip Card Component
 * 로그 성질을 카드 뒤집기 애니메이션으로 표시
 */
const PropertyFlipCard: React.FC<PropertyFlipCardProps> = ({ property, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newFlipState = !isFlipped;
    setIsFlipped(newFlipState);
    if (onFlip) {
      onFlip(newFlipState);
    }
  };

  const getCategoryLabel = (category: LogProperty['category']): string => {
    const labels = {
      'basic': '기초',
      'change-of-base': '밑 변환',
      'exponential': '지수',
      'advanced': '심화'
    };
    return labels[category];
  };

  const getCategoryColor = (category: LogProperty['category']): string => {
    const colors = {
      'basic': 'rgba(76, 175, 80, 0.3)',
      'change-of-base': 'rgba(33, 150, 243, 0.3)',
      'exponential': 'rgba(255, 152, 0, 0.3)',
      'advanced': 'rgba(156, 39, 176, 0.3)'
    };
    return colors[category];
  };

  return (
    <div className="flip-card-container">
      <div
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleFlip()}
        aria-label={`${property.title} 카드. 클릭하여 뒤집기`}
      >
        {/* 앞면 - 공식 */}
        <div className="card-face card-front">
          <div
            className="card-category-badge"
            style={{ background: getCategoryColor(property.category) }}
          >
            {getCategoryLabel(property.category)}
          </div>
          <h2 className="card-title">{property.title}</h2>
          <div className="card-formula">{property.formula}</div>
          <p className="card-hint">👆 클릭해서 설명 보기</p>
        </div>

        {/* 뒷면 - 설명 및 예제 */}
        <div className="card-face card-back">
          <div
            className="card-category-badge"
            style={{ background: getCategoryColor(property.category) }}
          >
            {getCategoryLabel(property.category)}
          </div>
          <h2 className="card-title">{property.title}</h2>
          <p className="card-explanation">{property.explanation}</p>
          {property.example && (
            <div className="card-example">
              <strong>예제:</strong><br />
              {property.example}
            </div>
          )}
          <p className="card-hint">👆 클릭해서 공식 보기</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyFlipCard;
