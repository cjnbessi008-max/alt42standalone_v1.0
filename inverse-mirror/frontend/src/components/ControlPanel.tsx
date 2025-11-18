import React from 'react';

interface ControlPanelProps {
  functionExpression: string;
  setFunctionExpression: (value: string) => void;
  selectedPoint: number;
  setSelectedPoint: (value: number) => void;
  domainMin: number;
  setDomainMin: (value: number) => void;
  domainMax: number;
  setDomainMax: (value: number) => void;
  showInverse: boolean;
  setShowInverse: (value: boolean) => void;
  showDerivative: boolean;
  setShowDerivative: (value: boolean) => void;
  showMirrorLine: boolean;
  setShowMirrorLine: (value: boolean) => void;
  onLoadProblem: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  functionExpression,
  setFunctionExpression,
  selectedPoint,
  setSelectedPoint,
  domainMin,
  setDomainMin,
  domainMax,
  setDomainMax,
  showInverse,
  setShowInverse,
  showDerivative,
  setShowDerivative,
  showMirrorLine,
  setShowMirrorLine,
  onLoadProblem,
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="function">함수 f(x):</label>
        <input
          id="function"
          type="text"
          value={functionExpression}
          onChange={(e) => setFunctionExpression(e.target.value)}
          placeholder="예: x^2, sin(x), exp(x)"
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="control-group" style={{ flex: 1 }}>
          <label htmlFor="domainMin">정의역 최소:</label>
          <input
            id="domainMin"
            type="number"
            value={domainMin}
            onChange={(e) => setDomainMin(parseFloat(e.target.value))}
            step="0.1"
          />
        </div>

        <div className="control-group" style={{ flex: 1 }}>
          <label htmlFor="domainMax">정의역 최대:</label>
          <input
            id="domainMax"
            type="number"
            value={domainMax}
            onChange={(e) => setDomainMax(parseFloat(e.target.value))}
            step="0.1"
          />
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="point">선택된 점 x:</label>
        <input
          id="point"
          type="range"
          value={selectedPoint}
          onChange={(e) => setSelectedPoint(parseFloat(e.target.value))}
          min={domainMin}
          max={domainMax}
          step="0.01"
          style={{ flex: 2 }}
        />
        <span style={{ minWidth: '80px', textAlign: 'right', fontWeight: 'bold' }}>
          {selectedPoint.toFixed(2)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showInverse}
            onChange={(e) => setShowInverse(e.target.checked)}
          />
          <span>역함수 표시</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDerivative}
            onChange={(e) => setShowDerivative(e.target.checked)}
          />
          <span>미분 표시</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showMirrorLine}
            onChange={(e) => setShowMirrorLine(e.target.checked)}
          />
          <span>거울선 (y=x)</span>
        </label>
      </div>

      <button className="button" onClick={onLoadProblem}>
        📚 Moodle에서 문제 가져오기
      </button>
    </div>
  );
};

export default ControlPanel;
