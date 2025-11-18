/**
 * Calm Mode Toggle Component
 * 안정 모드 수동 토글 버튼
 */

import React from 'react';
import { useCalmMode } from './CalmModeProvider';

export const CalmModeToggle = ({ className = '' }) => {
  const { isCalmMode, brainStatus, toggleCalmMode } = useCalmMode();

  return (
    <button
      className={`calm-mode-toggle ${className}`}
      onClick={toggleCalmMode}
      aria-pressed={isCalmMode}
      aria-label={isCalmMode ? '안정 모드 비활성화' : '안정 모드 활성화'}
      title={
        isCalmMode
          ? '안정 모드를 비활성화합니다'
          : '안정 모드를 활성화합니다 (뇌 과열 시 자동 활성화됨)'
      }
    >
      {isCalmMode ? '🔵' : '⚪'} 안정 모드
      {brainStatus.overheated && (
        <span className="overheated-indicator" aria-label="과열 경고">
          ⚠️
        </span>
      )}
    </button>
  );
};

export default CalmModeToggle;
