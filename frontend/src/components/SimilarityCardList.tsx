import React, { useState, useEffect } from 'react';
import { SimilarityCard } from './SimilarityCard';
import { similarityConditions } from '../data/similarityConditions';
import { SimilarityType } from '../types/similarity';
import '../styles/SimilarityCardList.css';

interface SimilarityCardListProps {
  activeSimilarity?: SimilarityType | null;
  onCardClick?: (type: SimilarityType) => void;
}

/**
 * 닮음 조건 카드 목록 컴포넌트
 */
export const SimilarityCardList: React.FC<SimilarityCardListProps> = ({
  activeSimilarity,
  onCardClick,
}) => {
  const [selectedCard, setSelectedCard] = useState<SimilarityType | null>(null);

  useEffect(() => {
    if (activeSimilarity) {
      setSelectedCard(activeSimilarity);
    }
  }, [activeSimilarity]);

  const handleCardClick = (type: SimilarityType) => {
    setSelectedCard(type);
    if (onCardClick) {
      onCardClick(type);
    }
  };

  return (
    <div className="similarity-card-list">
      <div className="card-list-header">
        <h2 className="card-list-title">삼각형 닮음 조건</h2>
        <p className="card-list-subtitle">Triangle Similarity Conditions</p>
      </div>

      <div className="card-grid">
        {similarityConditions.map((condition, index) => (
          <SimilarityCard
            key={condition.id}
            condition={condition}
            isActive={selectedCard === condition.type}
            onClick={() => handleCardClick(condition.type)}
            delay={index * 0.1}
          />
        ))}
      </div>

      {selectedCard && (
        <div className="selected-info">
          <p className="info-text">
            선택된 조건: <strong>{selectedCard}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default SimilarityCardList;
