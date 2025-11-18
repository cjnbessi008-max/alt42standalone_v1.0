/**
 * Vector Blend LMS - Color Display Component
 * Shows the blended color result from vectors
 */

import React from 'react';
import type { RGB } from '../../types/vector';
import { rgbToString, rgbToHex, getContrastColor } from '../../engine/color';
import './ColorDisplay.css';

interface ColorDisplayProps {
  color: RGB;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showValues?: boolean;
}

const ColorDisplay: React.FC<ColorDisplayProps> = ({
  color,
  label = 'Result Color',
  size = 'medium',
  showValues = true,
}) => {
  const colorString = rgbToString(color);
  const hexString = rgbToHex(color);
  const textColor = rgbToString(getContrastColor(color));

  const sizeClasses = {
    small: 'color-display-small',
    medium: 'color-display-medium',
    large: 'color-display-large',
  };

  return (
    <div className={`color-display ${sizeClasses[size]}`}>
      <div className="color-display-label">{label}</div>
      <div
        className="color-display-swatch"
        style={{
          backgroundColor: colorString,
          color: textColor,
        }}
      >
        {showValues && (
          <div className="color-display-values">
            <div className="color-hex">{hexString}</div>
            <div className="color-rgb">
              RGB({color.r}, {color.g}, {color.b})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorDisplay;
