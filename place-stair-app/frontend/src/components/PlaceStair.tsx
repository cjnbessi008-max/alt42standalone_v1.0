import React, { useEffect, useRef } from 'react';
import { StairConfig } from '../types';
import './PlaceStair.css';

interface PlaceStairProps {
  number: number;
  interactive?: boolean;
  onStairClick?: (place: string, value: number) => void;
}

const PlaceStair: React.FC<PlaceStairProps> = ({ number, interactive = false, onStairClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse number into place values
  const getPlaceValues = (num: number): StairConfig[] => {
    const str = num.toString().padStart(4, '0');
    const places: StairConfig[] = [
      { place: 'thousands', value: parseInt(str[0]), maxValue: 9, color: '#9333ea', label: '천' },
      { place: 'hundreds', value: parseInt(str[1]), maxValue: 9, color: '#3b82f6', label: '백' },
      { place: 'tens', value: parseInt(str[2]), maxValue: 9, color: '#10b981', label: '십' },
      { place: 'ones', value: parseInt(str[3]), maxValue: 9, color: '#f59e0b', label: '일' }
    ];

    return places.filter(p => p.value > 0 || num > 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const stairs = getPlaceValues(number);
    const stairWidth = rect.width / stairs.length;
    const maxHeight = rect.height * 0.7;

    // Draw stairs
    stairs.forEach((stair, index) => {
      const x = index * stairWidth;
      const heightRatio = stair.value / 10; // 0-1 scale
      const height = maxHeight * heightRatio;
      const y = rect.height - height - 30;

      // Draw stair block
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, stair.color);
      gradient.addColorStop(1, adjustBrightness(stair.color, -30));

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 5, y, stairWidth - 10, height);

      // Draw glow effect for non-zero values
      if (stair.value > 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = stair.color;
        ctx.fillRect(x + 5, y, stairWidth - 10, height);
        ctx.shadowBlur = 0;
      }

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y, stairWidth - 10, height);

      // Draw value text on stair
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${stair.value * Math.pow(10, stairs.length - index - 1)}`, x + stairWidth / 2, y + height / 2);

      // Draw place label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${stair.label}의 자리`, x + stairWidth / 2, rect.height - 10);

      // Draw light dots (LEDs) on the stair
      const dotsPerRow = 3;
      const dotRadius = 3;
      const dotSpacing = 8;

      for (let row = 0; row < Math.ceil(stair.value); row++) {
        for (let col = 0; col < dotsPerRow; col++) {
          const dotX = x + stairWidth / 2 - (dotsPerRow * dotSpacing) / 2 + col * dotSpacing + 10;
          const dotY = y + height - 20 - row * dotSpacing;

          if (row * dotsPerRow + col < stair.value) {
            // Lit LED
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = stair.color;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    });
  }, [number]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onStairClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const stairs = getPlaceValues(number);
    const stairWidth = rect.width / stairs.length;
    const clickedIndex = Math.floor(x / stairWidth);

    if (clickedIndex >= 0 && clickedIndex < stairs.length) {
      const stair = stairs[clickedIndex];
      onStairClick(stair.place, stair.value * Math.pow(10, stairs.length - clickedIndex - 1));
    }
  };

  return (
    <div className="place-stair-container">
      <canvas
        ref={canvasRef}
        className={`place-stair-canvas ${interactive ? 'interactive' : ''}`}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default PlaceStair;
