/**
 * Dot Expansion Component
 * 경우의 수가 증가하면 빛점들이 늘어나는 시각화 컴포넌트
 *
 * Features:
 * - Multiple dot patterns (grid, circle, scatter, tree, pyramid)
 * - Smooth animations using Framer Motion
 * - Glow effects for visual appeal
 * - Interactive dots with click handlers
 * - Responsive layout
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, useTheme } from '@mui/material';
import type { DotExpansionProps, DotPattern } from '../../types';

const DEFAULT_CONFIG = {
  size: 20,
  spacing: 8,
  color: 'primary' as const,
  glowEffect: true,
  animationDuration: 300
};

const DotExpansion: React.FC<DotExpansionProps> = ({
  count,
  pattern = 'grid',
  config = {},
  maxDotsPerRow = 10,
  onDotClick,
  animate = true
}) => {
  const theme = useTheme();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Get color from theme
  const getColor = (colorName: string) => {
    const colorMap: Record<string, string> = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main
    };
    return colorMap[colorName] || theme.palette.primary.main;
  };

  const dotColor = getColor(finalConfig.color);

  // Calculate dot positions based on pattern
  const dotPositions = useMemo(() => {
    return calculateDotPositions(count, pattern, maxDotsPerRow, finalConfig.size, finalConfig.spacing);
  }, [count, pattern, maxDotsPerRow, finalConfig.size, finalConfig.spacing]);

  // Container dimensions
  const containerDimensions = useMemo(() => {
    if (dotPositions.length === 0) return { width: 0, height: 0 };

    const maxX = Math.max(...dotPositions.map(p => p.x));
    const maxY = Math.max(...dotPositions.map(p => p.y));

    return {
      width: maxX + finalConfig.size + finalConfig.spacing * 2,
      height: maxY + finalConfig.size + finalConfig.spacing * 2
    };
  }, [dotPositions, finalConfig.size, finalConfig.spacing]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: containerDimensions.width,
        height: containerDimensions.height,
        minWidth: 100,
        minHeight: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto'
      }}
    >
      <AnimatePresence mode="popLayout">
        {dotPositions.map((pos, index) => (
          <motion.div
            key={`dot-${index}`}
            initial={animate ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: finalConfig.animationDuration / 1000,
              delay: animate ? index * 0.02 : 0,
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: finalConfig.size,
              height: finalConfig.size,
              borderRadius: '50%',
              backgroundColor: dotColor,
              cursor: onDotClick ? 'pointer' : 'default',
              boxShadow: finalConfig.glowEffect
                ? `0 0 ${finalConfig.size / 2}px ${dotColor}40, 0 0 ${finalConfig.size}px ${dotColor}20`
                : 'none',
              transition: 'all 0.2s ease'
            }}
            whileHover={onDotClick ? {
              scale: 1.3,
              boxShadow: `0 0 ${finalConfig.size}px ${dotColor}, 0 0 ${finalConfig.size * 2}px ${dotColor}60`
            } : undefined}
            whileTap={onDotClick ? { scale: 0.9 } : undefined}
            onClick={() => onDotClick?.(index)}
          />
        ))}
      </AnimatePresence>
    </Box>
  );
};

// Helper function to calculate dot positions based on pattern
function calculateDotPositions(
  count: number,
  pattern: DotPattern,
  maxDotsPerRow: number,
  dotSize: number,
  spacing: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const step = dotSize + spacing;

  switch (pattern) {
    case 'grid': {
      // Grid pattern: arrange dots in rows and columns
      for (let i = 0; i < count; i++) {
        const col = i % maxDotsPerRow;
        const row = Math.floor(i / maxDotsPerRow);
        positions.push({
          x: spacing + col * step,
          y: spacing + row * step
        });
      }
      break;
    }

    case 'circle': {
      // Circle pattern: arrange dots in concentric circles
      let remaining = count;
      let radius = step;
      let dotIndex = 0;

      while (remaining > 0) {
        const circumference = 2 * Math.PI * radius;
        const dotsInRing = radius === 0 ? 1 : Math.min(
          Math.floor(circumference / step),
          remaining
        );

        for (let i = 0; i < dotsInRing; i++) {
          const angle = (2 * Math.PI * i) / dotsInRing;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          positions.push({
            x: x + (maxDotsPerRow * step) / 2,
            y: y + (maxDotsPerRow * step) / 2
          });

          dotIndex++;
          remaining--;
          if (remaining === 0) break;
        }

        radius += step;
      }
      break;
    }

    case 'pyramid': {
      // Pyramid pattern: triangle shape
      let row = 0;
      let dotIndex = 0;

      while (dotIndex < count) {
        const dotsInRow = row + 1;
        const rowWidth = dotsInRow * step;
        const offsetX = (maxDotsPerRow * step - rowWidth) / 2;

        for (let col = 0; col < dotsInRow && dotIndex < count; col++) {
          positions.push({
            x: spacing + offsetX + col * step,
            y: spacing + row * step
          });
          dotIndex++;
        }
        row++;
      }
      break;
    }

    case 'scatter': {
      // Scatter pattern: random but evenly distributed
      const gridSize = Math.ceil(Math.sqrt(count));
      const cellSize = step * 2;

      for (let i = 0; i < count; i++) {
        const col = i % gridSize;
        const row = Math.floor(i / gridSize);

        // Add randomness within cell
        const randomX = (Math.random() - 0.5) * step * 0.5;
        const randomY = (Math.random() - 0.5) * step * 0.5;

        positions.push({
          x: spacing + col * cellSize + randomX,
          y: spacing + row * cellSize + randomY
        });
      }
      break;
    }

    case 'tree': {
      // Tree pattern: binary tree structure
      const levels = Math.ceil(Math.log2(count + 1));
      let dotIndex = 0;

      for (let level = 0; level < levels && dotIndex < count; level++) {
        const dotsInLevel = Math.pow(2, level);
        const levelWidth = maxDotsPerRow * step;
        const dotSpacing = levelWidth / (dotsInLevel + 1);

        for (let i = 0; i < dotsInLevel && dotIndex < count; i++) {
          positions.push({
            x: dotSpacing * (i + 1),
            y: spacing + level * step * 1.5
          });
          dotIndex++;
        }
      }
      break;
    }

    default:
      // Fallback to grid
      for (let i = 0; i < count; i++) {
        const col = i % maxDotsPerRow;
        const row = Math.floor(i / maxDotsPerRow);
        positions.push({
          x: spacing + col * step,
          y: spacing + row * step
        });
      }
  }

  return positions;
}

export default DotExpansion;
