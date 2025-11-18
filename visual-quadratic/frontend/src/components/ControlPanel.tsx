import React from 'react';
import { useQuadraticStore } from '../store/quadraticStore';
import './ControlPanel.css';

export const ControlPanel: React.FC = () => {
  const { coefficients, setA, setB, setC, roots } = useQuadraticStore();

  return (
    <div className="control-panel">
      <h2>이차방정식 조작판</h2>

      <div className="equation-display">
        <h3>y = {coefficients.a}x² + {coefficients.b}x + {coefficients.c}</h3>
      </div>

      <div className="coefficient-controls">
        <div className="control-group">
          <label htmlFor="coeff-a">
            계수 a (포물선 모양)
            <span className="value">{coefficients.a.toFixed(2)}</span>
          </label>
          <input
            id="coeff-a"
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={coefficients.a}
            onChange={(e) => setA(parseFloat(e.target.value))}
          />
          <div className="hint">
            {coefficients.a > 0 ? '위로 볼록 ∪' : coefficients.a < 0 ? '아래로 볼록 ∩' : '직선'}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="coeff-b">
            계수 b (좌우 이동)
            <span className="value">{coefficients.b.toFixed(2)}</span>
          </label>
          <input
            id="coeff-b"
            type="range"
            min="-10"
            max="10"
            step="0.1"
            value={coefficients.b}
            onChange={(e) => setB(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="coeff-c">
            계수 c (상하 이동)
            <span className="value">{coefficients.c.toFixed(2)}</span>
          </label>
          <input
            id="coeff-c"
            type="range"
            min="-10"
            max="10"
            step="0.1"
            value={coefficients.c}
            onChange={(e) => setC(parseFloat(e.target.value))}
          />
          <div className="hint">
            y축과의 교점: (0, {coefficients.c.toFixed(2)})
          </div>
        </div>
      </div>

      <div className="roots-info">
        <h3>근의 정보</h3>
        {roots.length === 0 ? (
          <p>근이 없습니다 (a = 0인 경우)</p>
        ) : roots[0].type === 'complex' ? (
          <p>허근 (그래프가 x축과 만나지 않음)</p>
        ) : (
          <div>
            {roots.map((root, idx) => (
              <div key={idx} className="root-item">
                <span className="root-label">근 {idx + 1}:</span>
                <span className="root-value">x = {root.x.toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <button onClick={() => { setA(1); setB(0); setC(0); }}>
          초기화
        </button>
        <button onClick={() => { setA(1); setB(0); setC(-4); }}>
          예제 1: x² - 4
        </button>
        <button onClick={() => { setA(1); setB(-3); setC(2); }}>
          예제 2: x² - 3x + 2
        </button>
        <button onClick={() => { setA(-1); setB(2); setC(3); }}>
          예제 3: -x² + 2x + 3
        </button>
      </div>
    </div>
  );
};
