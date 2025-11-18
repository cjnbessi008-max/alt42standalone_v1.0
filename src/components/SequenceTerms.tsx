import React from 'react'
import './SequenceTerms.css'
import { SequenceTerm } from './DragToGraphApp'

interface SequenceTermsProps {
  terms: SequenceTerm[]
  onDragStart: (term: SequenceTerm) => void
}

const SequenceTerms: React.FC<SequenceTermsProps> = ({ terms, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent, term: SequenceTerm) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    onDragStart(term)
  }

  return (
    <div className="sequence-terms-container">
      <h3 className="sequence-title">수열의 항</h3>
      <div className="sequence-terms">
        {terms.map(term => (
          <div
            key={term.id}
            className={`sequence-term ${term.placed ? 'placed' : ''}`}
            draggable={!term.placed}
            onDragStart={(e) => handleDragStart(e, term)}
          >
            <div className="term-index">a<sub>{term.index}</sub></div>
            <div className="term-value">{term.value}</div>
            {term.placed && <div className="check-mark">✓</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SequenceTerms
