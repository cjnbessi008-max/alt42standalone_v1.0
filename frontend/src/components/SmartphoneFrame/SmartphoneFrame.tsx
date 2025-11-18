/**
 * Unfolding Net Live - Smartphone Frame Component
 * 우측 하단에 표시되는 가상 스마트폰 UI
 */

import React, { useState } from 'react';
import { UnfoldingNetViewer } from '../UnfoldingNet/UnfoldingNetViewer';
import { AnimationControls } from '../UnfoldingNet/AnimationControls';
import './SmartphoneFrame.css';

interface SmartphoneFrameProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  minimizable?: boolean;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  position = 'bottom-right',
  minimizable = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className={`smartphone-frame ${position} ${isMinimized ? 'minimized' : ''}`}>
      {/* 스마트폰 외곽 프레임 */}
      <div className="phone-shell">
        {/* 노치 (상단 카메라 영역) */}
        <div className="phone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* 헤더 */}
        <div className="phone-header">
          <div className="header-left">
            <div className="status-icon wifi"></div>
            <div className="status-icon signal"></div>
          </div>

          <div className="header-center">
            <h2 className="app-title">Unfolding Net Live</h2>
          </div>

          <div className="header-right">
            <div className="battery-icon">
              <div className="battery-level"></div>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="phone-content">
          {!isMinimized && (
            <>
              {/* 3D 뷰어 */}
              <div className="viewer-section">
                <UnfoldingNetViewer />
              </div>

              {/* 애니메이션 컨트롤 */}
              {showControls && (
                <div className="controls-section">
                  <AnimationControls />
                </div>
              )}

              {/* 컨트롤 토글 버튼 */}
              <button
                className="toggle-controls-btn"
                onClick={toggleControls}
                title={showControls ? '컨트롤 숨기기' : '컨트롤 표시'}
              >
                {showControls ? '▲' : '▼'}
              </button>
            </>
          )}
        </div>

        {/* 하단 제스처 바 (iOS 스타일) */}
        <div className="phone-gesture-bar"></div>

        {/* 최소화/최대화 버튼 */}
        {minimizable && (
          <button
            className="minimize-btn"
            onClick={toggleMinimize}
            title={isMinimized ? '최대화' : '최소화'}
          >
            {isMinimized ? '□' : '−'}
          </button>
        )}
      </div>

      {/* 그림자 */}
      <div className="phone-shadow"></div>
    </div>
  );
};
