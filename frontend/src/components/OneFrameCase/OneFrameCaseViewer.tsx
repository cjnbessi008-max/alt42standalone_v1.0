/**
 * OneFrameCaseViewer Component
 *
 * Main component for displaying One-Frame Case visualizations
 * Supports multiple layout algorithms and animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { CaseData, InteractionType, InteractionData } from '@types/oneFrameCase';
import CaseNode from './CaseNode';
import CaseLayout from './CaseLayout';
import './OneFrameCaseViewer.css';

interface OneFrameCaseViewerProps {
  caseData: CaseData;
  studentId?: string;
  onInteraction?: (interaction: InteractionData) => void;
  autoPlay?: boolean;
  width?: number;
  height?: number;
}

const OneFrameCaseViewer: React.FC<OneFrameCaseViewerProps> = ({
  caseData,
  studentId,
  onInteraction,
  autoPlay = true,
  width = 800,
  height = 600,
}) => {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [viewedCases, setViewedCases] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate positions using layout algorithm
  const casesWithPositions = CaseLayout.calculateLayout(
    caseData.cases,
    caseData.layout,
    { width, height }
  );

  useEffect(() => {
    if (autoPlay && caseData.animation) {
      setIsAnimating(true);
      // Animation will complete based on individual node delays
      const totalDuration = caseData.animation.duration * caseData.cases.length;
      setTimeout(() => setIsAnimating(false), totalDuration);
    }
  }, [caseData, autoPlay]);

  const handleCaseInteraction = (caseId: string, type: InteractionType) => {
    const interactionData: InteractionData = {
      caseNodeId: caseId,
      interactionType: type,
      timestamp: Date.now(),
    };

    // Track viewed cases
    if (type === 'click' || type === 'view') {
      setViewedCases(prev => new Set([...prev, caseId]));
      setActiveCaseId(caseId);
    }

    // Call parent callback
    if (onInteraction) {
      onInteraction(interactionData);
    }

    // Also send to API if studentId is provided
    if (studentId && type === 'click') {
      recordInteraction(caseId, interactionData);
    }
  };

  const recordInteraction = async (caseId: string, interaction: InteractionData) => {
    try {
      // This will be implemented with the API service
      console.log('Recording interaction:', { caseId, studentId, interaction });
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  const getAnimationDelay = (index: number): number => {
    if (!caseData.animation || !autoPlay) return 0;

    switch (caseData.animation.type) {
      case 'sequential':
        return index * caseData.animation.duration;

      case 'parallel':
        return 0;

      case 'radial':
        // Radial from center outward
        return index * (caseData.animation.duration / caseData.cases.length);

      default:
        return 0;
    }
  };

  return (
    <div
      ref={containerRef}
      className="one-frame-case-viewer"
      style={{ width, height }}
      role="application"
      aria-label={`${caseData.title} - Case Visualization`}
    >
      <div className="case-header">
        <h2 className="case-title">{caseData.title}</h2>
        <p className="case-description">{caseData.description}</p>
      </div>

      <svg className="case-connections" width={width} height={height}>
        {casesWithPositions.map(caseItem => {
          if (!caseItem.connections) return null;

          return caseItem.connections.map(targetId => {
            const targetCase = casesWithPositions.find(c => c.id === targetId);
            if (!targetCase || !caseItem.position || !targetCase.position) return null;

            const isRecommendedPath =
              caseItem.metadata?.isRecommended && targetCase.metadata?.isRecommended;

            return (
              <line
                key={`${caseItem.id}-${targetId}`}
                className={`case-connection ${isRecommendedPath ? 'recommended' : ''}`}
                x1={caseItem.position.x + (caseItem.size?.width || 150) / 2}
                y1={caseItem.position.y + (caseItem.size?.height || 100) / 2}
                x2={targetCase.position.x + (targetCase.size?.width || 150) / 2}
                y2={targetCase.position.y + (targetCase.size?.height || 100) / 2}
                strokeDasharray={isRecommendedPath ? '0' : '5,5'}
              />
            );
          });
        })}
      </svg>

      <div className="case-nodes-container">
        {casesWithPositions.map((caseItem, index) => (
          <CaseNode
            key={caseItem.id}
            case={caseItem}
            isRecommended={caseItem.metadata?.isRecommended}
            isActive={activeCaseId === caseItem.id}
            onInteraction={handleCaseInteraction}
            animationDelay={getAnimationDelay(index)}
          />
        ))}
      </div>

      <div className="case-controls">
        <div className="case-stats">
          <span className="stat-item">
            총 {caseData.cases.length}개 경로
          </span>
          <span className="stat-item">
            탐색: {viewedCases.size}/{caseData.cases.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OneFrameCaseViewer;
