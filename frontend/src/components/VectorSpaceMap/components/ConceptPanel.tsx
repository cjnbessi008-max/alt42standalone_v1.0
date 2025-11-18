import React from 'react';
import type { Concept } from '@types/index';
import './ConceptPanel.css';

interface ConceptPanelProps {
  concept: Concept;
  onClose: () => void;
}

/**
 * 개념 상세 정보 패널
 */
const ConceptPanel: React.FC<ConceptPanelProps> = ({ concept, onClose }) => {
  return (
    <div className="concept-panel">
      <div className="concept-panel-header">
        <h3>{concept.name}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="concept-panel-body">
        <div className="concept-info">
          <div className="info-row">
            <span className="label">카테고리:</span>
            <span className="value">{concept.category}</span>
          </div>

          <div className="info-row">
            <span className="label">난이도:</span>
            <span className="value">
              {'⭐'.repeat(concept.difficulty)}
            </span>
          </div>

          {concept.description && (
            <div className="info-row description">
              <span className="label">설명:</span>
              <p className="value">{concept.description}</p>
            </div>
          )}

          {concept.parentConceptId && (
            <div className="info-row">
              <span className="label">선행 개념:</span>
              <span className="value">있음</span>
            </div>
          )}
        </div>

        {concept.metadata && Object.keys(concept.metadata).length > 0 && (
          <div className="concept-metadata">
            <h4>추가 정보</h4>
            <ul>
              {Object.entries(concept.metadata).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {JSON.stringify(value)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptPanel;
