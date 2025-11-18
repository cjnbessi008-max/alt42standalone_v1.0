import React, { useState, useEffect } from 'react';
import './Candle.css';

function Candle({ index, animated = true, highlighted = false, delay = 0 }) {
  const [isLit, setIsLit] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsLit(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [animated, delay]);

  return (
    <div className={`candle-wrapper ${highlighted ? 'highlighted' : ''}`}>
      <div className={`candle ${isLit ? 'lit' : ''}`}>
        {/* Flame */}
        <div className={`flame ${isLit ? 'burning' : ''}`}>
          <div className="flame-inner"></div>
          <div className="flame-glow"></div>
        </div>

        {/* Wick */}
        <div className="wick"></div>

        {/* Wax body */}
        <div className="wax">
          <div className="wax-top"></div>
          <div className="wax-drip"></div>
        </div>

        {/* Shadow */}
        <div className="candle-shadow"></div>
      </div>

      {/* Candle number */}
      {highlighted && (
        <div className="candle-number">{index + 1}</div>
      )}
    </div>
  );
}

export default Candle;
