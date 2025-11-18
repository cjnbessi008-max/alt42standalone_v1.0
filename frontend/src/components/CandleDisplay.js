import React from 'react';
import Candle from './Candle';
import './CandleDisplay.css';

function CandleDisplay({ count, animated = true, highlightIndex = null }) {
  const candles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="candle-display">
      <div className="candle-container">
        {candles.map((index) => (
          <Candle
            key={index}
            index={index}
            animated={animated}
            highlighted={highlightIndex === index}
            delay={animated ? index * 300 : 0}
          />
        ))}
      </div>

      <div className="candle-count">
        <span className="count-label">촛불 개수:</span>
        <span className="count-value">{count}</span>
      </div>
    </div>
  );
}

export default CandleDisplay;
