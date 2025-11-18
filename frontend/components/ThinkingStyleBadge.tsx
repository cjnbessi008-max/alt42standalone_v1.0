/**
 * ThinkingStyleBadge Component
 * Displays a student's thinking style with visual indicator
 */
import React from 'react';

export type ThinkingStyleType = 'computational' | 'intuitive' | 'visual';

interface ThinkingStyleBadgeProps {
  primaryStyle: ThinkingStyleType;
  score: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

const styleConfig = {
  computational: {
    label: '계산형',
    labelEn: 'Computational',
    color: '#3B82F6', // Blue
    icon: '🔢',
    description: '논리적이고 단계적인 사고',
  },
  intuitive: {
    label: '직관형',
    labelEn: 'Intuitive',
    color: '#10B981', // Green
    icon: '⚡',
    description: '패턴 인식과 직감적 사고',
  },
  visual: {
    label: '그림형',
    labelEn: 'Visual',
    color: '#F59E0B', // Orange
    icon: '🎨',
    description: '시각적이고 공간적인 사고',
  },
};

export const ThinkingStyleBadge: React.FC<ThinkingStyleBadgeProps> = ({
  primaryStyle,
  score,
  variant = 'compact',
  className = '',
}) => {
  const config = styleConfig[primaryStyle];

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
        style={{ backgroundColor: `${config.color}20`, border: `2px solid ${config.color}` }}
      >
        <span className="text-lg">{config.icon}</span>
        <span className="font-semibold" style={{ color: config.color }}>
          {config.label}
        </span>
        <span className="text-sm text-gray-600">{Math.round(score)}%</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg ${className}`}
      style={{ backgroundColor: `${config.color}10`, border: `2px solid ${config.color}` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{config.icon}</span>
        <div>
          <h3 className="font-bold text-lg" style={{ color: config.color }}>
            {config.label} ({config.labelEn})
          </h3>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-1">
          <span>강도</span>
          <span className="font-semibold">{Math.round(score)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${score}%`, backgroundColor: config.color }}
          />
        </div>
      </div>
    </div>
  );
};

export default ThinkingStyleBadge;
