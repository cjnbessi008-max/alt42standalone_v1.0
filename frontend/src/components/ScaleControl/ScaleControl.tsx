/**
 * 배율 컨트롤 컴포넌트
 * 슬라이더로 배율을 조정하고 Scale Sound를 재생합니다.
 */

import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import './ScaleControl.css';

interface ScaleControlProps {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  onScaleChange: (scale: number) => void;
  soundEnabled?: boolean;
}

export const ScaleControl: React.FC<ScaleControlProps> = ({
  initialScale = 1.0,
  minScale = 0.5,
  maxScale = 3.0,
  onScaleChange,
  soundEnabled = true
}) => {
  const [scale, setScale] = useState<number>(initialScale);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundEnabled);
  const [noteName, setNoteName] = useState<string>('A4');

  useEffect(() => {
    // 배율이 변경되면 음계 이름 업데이트
    const note = audioService.getNoteName(scale);
    setNoteName(note);
  }, [scale]);

  /**
   * 슬라이더 값 변경 핸들러
   */
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newScale = parseFloat(event.target.value);
    setScale(newScale);
    onScaleChange(newScale);

    // Scale Sound 재생
    if (isSoundEnabled) {
      audioService.playScaleSound(newScale);
    }
  };

  /**
   * 사운드 토글
   */
  const toggleSound = (): void => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  /**
   * 배율 리셋
   */
  const resetScale = (): void => {
    setScale(1.0);
    onScaleChange(1.0);
    if (isSoundEnabled) {
      audioService.playScaleSound(1.0);
    }
  };

  /**
   * 사운드 테스트
   */
  const testSound = async (): Promise<void> => {
    await audioService.resumeAudioContext();
    audioService.playScaleSound(scale, 0.5);
  };

  return (
    <div className="scale-control">
      <div className="scale-control-header">
        <h3>닮음 배율 조정</h3>
        <button
          className={`sound-toggle ${isSoundEnabled ? 'enabled' : 'disabled'}`}
          onClick={toggleSound}
          title={isSoundEnabled ? '사운드 끄기' : '사운드 켜기'}
        >
          {isSoundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="scale-display">
        <div className="scale-value">{scale.toFixed(2)}x</div>
        <div className="scale-note">{noteName}</div>
      </div>

      <div className="slider-container">
        <label className="slider-label">
          <span className="slider-min">{minScale}x</span>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.01}
            value={scale}
            onChange={handleSliderChange}
            className="scale-slider"
          />
          <span className="slider-max">{maxScale}x</span>
        </label>
      </div>

      <div className="scale-info">
        <div className="info-item">
          <span className="info-label">면적 비율:</span>
          <span className="info-value">{(scale * scale).toFixed(2)}x</span>
        </div>
        <div className="info-item">
          <span className="info-label">둘레 비율:</span>
          <span className="info-value">{scale.toFixed(2)}x</span>
        </div>
      </div>

      <div className="control-buttons">
        <button className="btn btn-secondary" onClick={resetScale}>
          초기화 (1.0x)
        </button>
        <button className="btn btn-primary" onClick={testSound}>
          소리 테스트
        </button>
      </div>

      <div className="scale-description">
        <p>
          슬라이더를 움직이면 도형의 크기가 변하고,<br />
          배율에 따라 음높이가 변합니다.
        </p>
      </div>
    </div>
  );
};
