/**
 * CaseNode Component
 *
 * Represents a single case in the One-Frame visualization
 */

import React, { useState } from 'react';
import { Case, InteractionType } from '@types/oneFrameCase';
import './CaseNode.css';

interface CaseNodeProps {
  case: Case;
  isRecommended?: boolean;
  isActive?: boolean;
  onInteraction: (caseId: string, type: InteractionType) => void;
  animationDelay?: number;
}

const CaseNode: React.FC<CaseNodeProps> = ({
  case: caseData,
  isRecommended = false,
  isActive = false,
  onInteraction,
  animationDelay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [interactionStartTime, setInteractionStartTime] = useState<number | null>(null);

  const handleClick = () => {
    onInteraction(caseData.id, 'click');
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setInteractionStartTime(Date.now());
    onInteraction(caseData.id, 'hover');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setInteractionStartTime(null);
  };

  const renderContent = () => {
    switch (caseData.content.type) {
      case 'text':
        return (
          <div className="case-content-text">
            {caseData.content.data.text || caseData.content.data}
          </div>
        );

      case 'image':
        return (
          <img
            src={caseData.content.data.src || caseData.content.data}
            alt={caseData.label}
            className="case-content-image"
          />
        );

      case 'svg':
        return (
          <div
            className="case-content-svg"
            dangerouslySetInnerHTML={{ __html: caseData.content.data.svg || caseData.content.data }}
          />
        );

      case 'interactive':
        return (
          <div className="case-content-interactive">
            {caseData.content.data.steps?.map((step: string, index: number) => (
              <div key={index} className="case-step">
                {index + 1}. {step}
              </div>
            ))}
          </div>
        );

      default:
        return <div className="case-content-default">{JSON.stringify(caseData.content.data)}</div>;
    }
  };

  const getDifficultyLabel = () => {
    const difficulty = caseData.metadata?.difficulty || 0;
    if (difficulty <= 1) return '쉬움';
    if (difficulty <= 2) return '보통';
    if (difficulty <= 3) return '어려움';
    return '매우 어려움';
  };

  const getTimeEstimate = () => {
    const time = caseData.metadata?.timeEstimate || 0;
    if (time < 60000) return `${Math.round(time / 1000)}초`;
    return `${Math.round(time / 60000)}분`;
  };

  return (
    <div
      className={`
        case-node
        ${isRecommended ? 'recommended' : ''}
        ${isActive ? 'active' : ''}
        ${isHovered ? 'hovered' : ''}
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
        left: caseData.position?.x,
        top: caseData.position?.y,
        width: caseData.size?.width,
        height: caseData.size?.height,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${caseData.label} - ${caseData.description || ''}`}
    >
      {isRecommended && (
        <div className="recommended-badge">추천</div>
      )}

      <div className="case-header">
        <h3 className="case-label">{caseData.label}</h3>
        {caseData.description && (
          <p className="case-description">{caseData.description}</p>
        )}
      </div>

      <div className="case-content">
        {renderContent()}
      </div>

      {caseData.metadata && (
        <div className="case-metadata">
          {caseData.metadata.difficulty && (
            <span className="metadata-item difficulty">
              {getDifficultyLabel()}
            </span>
          )}
          {caseData.metadata.timeEstimate && (
            <span className="metadata-item time">
              ⏱ {getTimeEstimate()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseNode;
