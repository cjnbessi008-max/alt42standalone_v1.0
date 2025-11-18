import React from 'react';
import './TripleLight.css';

interface TripleLightProps {
  mean: number;
  median: number;
  mode: number;
  meanBrightness: number;
  medianBrightness: number;
  modeBrightness: number;
}

const TripleLight: React.FC<TripleLightProps> = ({
  mean,
  median,
  mode,
  meanBrightness,
  medianBrightness,
  modeBrightness,
}) => {
  return (
    <div className="triple-light-container">
      <div className="triple-light-header">
        <h2>통계 조명판</h2>
        <p className="subtitle">Statistics Triple Light</p>
      </div>

      <div className="lights-wrapper">
        {/* Mean - Red Light */}
        <div className="light-item">
          <div className="light-label">
            <span className="label-ko">평균</span>
            <span className="label-en">Mean</span>
          </div>
          <div
            className="light red-light"
            style={{
              opacity: meanBrightness / 100,
              boxShadow: `
                0 0 ${meanBrightness * 0.4}px rgba(255, 77, 77, ${meanBrightness / 100}),
                0 0 ${meanBrightness * 0.8}px rgba(255, 77, 77, ${meanBrightness / 150}),
                inset 0 0 ${meanBrightness * 0.3}px rgba(255, 255, 255, ${meanBrightness / 200})
              `
            }}
          >
            <div className="light-inner"></div>
          </div>
          <div className="light-value">{mean.toFixed(1)}</div>
        </div>

        {/* Median - Green Light */}
        <div className="light-item">
          <div className="light-label">
            <span className="label-ko">중앙값</span>
            <span className="label-en">Median</span>
          </div>
          <div
            className="light green-light"
            style={{
              opacity: medianBrightness / 100,
              boxShadow: `
                0 0 ${medianBrightness * 0.4}px rgba(77, 255, 136, ${medianBrightness / 100}),
                0 0 ${medianBrightness * 0.8}px rgba(77, 255, 136, ${medianBrightness / 150}),
                inset 0 0 ${medianBrightness * 0.3}px rgba(255, 255, 255, ${medianBrightness / 200})
              `
            }}
          >
            <div className="light-inner"></div>
          </div>
          <div className="light-value">{median.toFixed(1)}</div>
        </div>

        {/* Mode - Blue Light */}
        <div className="light-item">
          <div className="light-label">
            <span className="label-ko">최빈값</span>
            <span className="label-en">Mode</span>
          </div>
          <div
            className="light blue-light"
            style={{
              opacity: modeBrightness / 100,
              boxShadow: `
                0 0 ${modeBrightness * 0.4}px rgba(77, 171, 255, ${modeBrightness / 100}),
                0 0 ${modeBrightness * 0.8}px rgba(77, 171, 255, ${modeBrightness / 150}),
                inset 0 0 ${modeBrightness * 0.3}px rgba(255, 255, 255, ${modeBrightness / 200})
              `
            }}
          >
            <div className="light-inner"></div>
          </div>
          <div className="light-value">{mode.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

export default TripleLight;
