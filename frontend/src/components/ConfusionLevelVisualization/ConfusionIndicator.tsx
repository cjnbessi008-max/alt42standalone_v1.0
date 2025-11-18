/**
 * Confusion Level Indicator Component
 *
 * Displays a color-coded circle or bar showing the current confusion level
 */

import React from 'react';
import {
  ConfusionLevel,
  ConfusionCategory,
  ConfusionColor,
} from '../../types/confusion';
import { categorizeConfusion, getConfusionColor, getConfusionDescription } from '../../services/confusionCalculator';

interface ConfusionIndicatorProps {
  level: ConfusionLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showValue?: boolean;
  variant?: 'circle' | 'bar';
  className?: string;
}

const ConfusionIndicator: React.FC<ConfusionIndicatorProps> = ({
  level,
  size = 'medium',
  showLabel = true,
  showValue = true,
  variant = 'circle',
  className = '',
}) => {
  const category = categorizeConfusion(level);
  const color = getConfusionColor(category);
  const description = getConfusionDescription(category);

  const sizeMap = {
    small: { circle: 40, bar: 100, text: 'text-xs' },
    medium: { circle: 60, bar: 200, text: 'text-sm' },
    large: { circle: 80, bar: 300, text: 'text-base' },
  };

  const dimensions = sizeMap[size];

  if (variant === 'circle') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div
          className="rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-all duration-300"
          style={{
            width: dimensions.circle,
            height: dimensions.circle,
            backgroundColor: color,
          }}
        >
          {showValue && <span className={dimensions.text}>{level}</span>}
        </div>
        {showLabel && (
          <div className="text-center">
            <p className={`font-medium ${dimensions.text}`}>{description}</p>
            <p className="text-xs text-gray-500 mt-1">혼란도: {level}%</p>
          </div>
        )}
      </div>
    );
  }

  // Bar variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="h-8 rounded-lg relative overflow-hidden bg-gray-200"
        style={{ width: dimensions.bar }}
      >
        <div
          className="h-full transition-all duration-500 ease-out flex items-center justify-center"
          style={{
            width: `${level}%`,
            backgroundColor: color,
          }}
        >
          {showValue && level > 15 && (
            <span className={`text-white font-bold ${dimensions.text}`}>{level}%</span>
          )}
        </div>
      </div>
      {showLabel && (
        <p className={`font-medium ${dimensions.text}`}>{description}</p>
      )}
    </div>
  );
};

export default ConfusionIndicator;
