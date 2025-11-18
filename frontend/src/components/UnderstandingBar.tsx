import React from 'react';
import { UnderstandingLevel, UNDERSTANDING_LEVEL_CONFIG } from '../types/understanding';
import './UnderstandingBar.css';

export interface UnderstandingBarProps {
  level: UnderstandingLevel;
  label?: string;
  showLabel?: boolean;
  showDescription?: boolean;
  animate?: boolean;
  size?: 'small' | 'medium' | 'large';
  onLevelClick?: (level: UnderstandingLevel) => void;
}

/**
 * UnderstandingBar Component
 * 학습자의 이해도를 3단계 막대로 시각화하는 컴포넌트
 *
 * @example
 * <UnderstandingBar level={2} showLabel={true} />
 */
export const UnderstandingBar: React.FC<UnderstandingBarProps> = ({
  level,
  label = '이해도',
  showLabel = true,
  showDescription = false,
  animate = true,
  size = 'medium',
  onLevelClick
}) => {
  const currentConfig = UNDERSTANDING_LEVEL_CONFIG[level];

  return (
    <div className={`understanding-bar understanding-bar--${size}`}>
      {showLabel && (
        <div className="understanding-bar__header">
          <span className="understanding-bar__label">{label}</span>
          <span className="understanding-bar__current-level" style={{ color: currentConfig.color }}>
            {currentConfig.label}
          </span>
        </div>
      )}

      <div className="understanding-bar__container">
        {([1, 2, 3] as UnderstandingLevel[]).map((segmentLevel) => {
          const config = UNDERSTANDING_LEVEL_CONFIG[segmentLevel];
          const isActive = segmentLevel <= level;
          const isCurrent = segmentLevel === level;

          return (
            <div
              key={segmentLevel}
              className={`understanding-bar__segment ${
                isActive ? 'understanding-bar__segment--active' : ''
              } ${
                isCurrent ? 'understanding-bar__segment--current' : ''
              } ${
                animate ? 'understanding-bar__segment--animated' : ''
              }`}
              style={{
                backgroundColor: isActive ? config.color : '#E0E0E0',
                cursor: onLevelClick ? 'pointer' : 'default'
              }}
              onClick={() => onLevelClick?.(segmentLevel)}
              data-level={segmentLevel}
              aria-label={`${config.label} (레벨 ${segmentLevel})`}
              role="button"
              tabIndex={onLevelClick ? 0 : -1}
            >
              <span className="understanding-bar__segment-label">
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {showDescription && (
        <div className="understanding-bar__description">
          {currentConfig.description}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of UnderstandingBar for use in smaller spaces
 */
export const UnderstandingBarCompact: React.FC<Pick<UnderstandingBarProps, 'level'>> = ({ level }) => {
  return (
    <div className="understanding-bar-compact">
      {([1, 2, 3] as UnderstandingLevel[]).map((segmentLevel) => {
        const config = UNDERSTANDING_LEVEL_CONFIG[segmentLevel];
        const isActive = segmentLevel <= level;

        return (
          <div
            key={segmentLevel}
            className={`understanding-bar-compact__dot ${
              isActive ? 'understanding-bar-compact__dot--active' : ''
            }`}
            style={{
              backgroundColor: isActive ? config.color : '#E0E0E0'
            }}
            aria-label={config.label}
          />
        );
      })}
    </div>
  );
};
