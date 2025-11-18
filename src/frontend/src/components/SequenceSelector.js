import React from 'react';
import './SequenceSelector.css';

const SequenceSelector = ({ sequences, selectedSequence, onSequenceChange }) => {
  return (
    <div className="sequence-selector">
      <h2>수열 선택</h2>
      <p className="selector-description">
        학습할 등비수열을 선택하세요
      </p>

      <div className="sequence-list">
        {sequences.map((sequence) => (
          <div
            key={sequence.id}
            className={`sequence-card ${selectedSequence?.id === sequence.id ? 'active' : ''}`}
            onClick={() => onSequenceChange(sequence.id)}
          >
            <h3>{sequence.name}</h3>
            <p className="sequence-description">{sequence.description}</p>
            <div className="sequence-details">
              <span className="detail-badge">{sequence.sequence_type}</span>
              <span className="detail-badge">{sequence.spiral_type}</span>
              {sequence.common_ratio && (
                <span className="detail-value">공비: {sequence.common_ratio}</span>
              )}
            </div>
            <div className="sequence-stats">
              <span>항수: {sequence.num_terms}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedSequence && (
        <div className="selected-info">
          <h3>선택된 수열</h3>
          <div className="selected-card">
            <h4>{selectedSequence.name}</h4>
            <div className="selected-details">
              <p>첫 항: {selectedSequence.first_term}</p>
              {selectedSequence.common_ratio && (
                <p>공비: {selectedSequence.common_ratio}</p>
              )}
              <p>항수: {selectedSequence.num_terms}</p>
              <p>나선 타입: {selectedSequence.spiral_type}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequenceSelector;
