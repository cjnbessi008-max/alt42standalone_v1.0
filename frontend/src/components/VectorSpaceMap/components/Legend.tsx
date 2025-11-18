import React from 'react';
import { getLegendItems, ColorScheme } from '../utils/colorMapping';
import './Legend.css';

interface LegendProps {
  colorScheme: ColorScheme;
}

/**
 * 범례 컴포넌트
 */
const Legend: React.FC<LegendProps> = ({ colorScheme }) => {
  const items = getLegendItems(colorScheme);

  const getTitle = () => {
    switch (colorScheme) {
      case 'by-category':
        return '카테고리별';
      case 'by-difficulty':
        return '난이도별';
      case 'by-mastery':
        return '숙달도별';
      default:
        return '범례';
    }
  };

  return (
    <div className="legend">
      <h4>{getTitle()}</h4>
      <div className="legend-items">
        {items.map((item, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
