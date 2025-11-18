/**
 * Calm Mode Banner Component
 * 안정 모드 활성화 알림 배너
 */

import React from 'react';
import { useCalmMode } from './CalmModeProvider';
import '../styles/calm-mode.css';

export const CalmModeBanner = () => {
  const { showBanner, brainStatus, closeBanner } = useCalmMode();

  if (!showBanner) {
    return null;
  }

  return (
    <div className="calm-mode-banner" role="alert">
      <span className="calm-mode-banner-icon" aria-hidden="true">
        🔵
      </span>
      <div className="calm-mode-banner-text">
        <strong>안정 모드 활성화</strong>
        <br />
        <small>
          뇌 과열이 감지되어 차분한 푸른색 UI로 전환되었습니다.
          (인지 부하: {(brainStatus.cognitiveLoad * 100).toFixed(0)}%)
        </small>
      </div>
      <button
        className="calm-mode-banner-close"
        onClick={closeBanner}
        aria-label="알림 닫기"
      >
        ×
      </button>
    </div>
  );
};

export default CalmModeBanner;
