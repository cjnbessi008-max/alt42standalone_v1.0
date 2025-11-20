import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Scene } from '../../types';
import './Scene1ClayTablet.css';

interface Props {
  scene: Scene;
  onComplete: () => void;
}

type SymbolType = '1' | '10' | '60';

interface PlacedSymbol {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
}

export default function Scene1ClayTablet({ scene, onComplete }: Props) {
  const [showNarrative, setShowNarrative] = useState(true);
  const [placedSymbols, setPlacedSymbols] = useState<PlacedSymbol[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const target = 270;
  const solution = { sixty: 4, ten: 3, one: 0 }; // 4×60 + 3×10 = 270

  const calculateTotal = () => {
    const counts = placedSymbols.reduce(
      (acc, symbol) => {
        acc[symbol.type]++;
        return acc;
      },
      { '1': 0, '10': 0, '60': 0 }
    );

    return counts['60'] * 60 + counts['10'] * 10 + counts['1'] * 1;
  };

  const handlePlaceSymbol = (type: SymbolType) => {
    const newSymbol: PlacedSymbol = {
      id: `${type}-${Date.now()}`,
      type,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
    };
    setPlacedSymbols([...placedSymbols, newSymbol]);
  };

  const handleCheck = () => {
    const total = calculateTotal();
    setAttempts(attempts + 1);

    if (total === target) {
      setShowSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    } else {
      alert(`현재 합: ${total}\n목표: ${target}\n${total < target ? '더 많은' : '더 적은'} 기호가 필요합니다.`);
    }
  };

  const handleReset = () => {
    setPlacedSymbols([]);
  };

  if (showNarrative) {
    return (
      <motion.div
        className="narrative-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="narrative-container">
          <div className="era-badge">{scene.era}</div>
          <h2 className="scene-title">{scene.title}</h2>
          <div className="narrative-text">
            {scene.narrative.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <button
            className="continue-button"
            onClick={() => setShowNarrative(false)}
          >
            여정 시작하기
          </button>
        </div>
      </motion.div>
    );
  }

  if (showSuccess) {
    return (
      <motion.div
        className="success-screen"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <h1 className="success-title">성공!</h1>
        <p className="success-message">
          {attempts === 1 && !showHint
            ? '놀라운 직관력입니다! 한 번에 성공했군요.'
            : '점토판에 숫자를 기록하는 법을 익혔습니다.'}
        </p>
        <div className="glow success-number">{target}</div>
      </motion.div>
    );
  }

  return (
    <div className="scene-container clay-tablet-scene">
      <div className="scene-header">
        <h2>{scene.title}</h2>
        <p className="objective">목표: 점토판에 숫자 {target}을 60진법으로 표현하기</p>
      </div>

      <div className="puzzle-area">
        <div className="clay-tablet">
          <div className="tablet-surface">
            {placedSymbols.map((symbol) => (
              <div
                key={symbol.id}
                className={`cuneiform-symbol symbol-${symbol.type}`}
                style={{
                  left: `${symbol.x}%`,
                  top: `${symbol.y}%`,
                }}
              >
                {symbol.type === '1' && 'V'}
                {symbol.type === '10' && '<'}
                {symbol.type === '60' && '◯'}
              </div>
            ))}
          </div>
          <div className="tablet-info">
            <p>현재 합: {calculateTotal()}</p>
          </div>
        </div>

        <div className="symbol-palette">
          <h3>쐐기문자 기호</h3>
          <div className="symbol-buttons">
            <button
              className="symbol-button"
              onClick={() => handlePlaceSymbol('1')}
            >
              <span className="symbol-display">V</span>
              <span className="symbol-value">1</span>
            </button>
            <button
              className="symbol-button"
              onClick={() => handlePlaceSymbol('10')}
            >
              <span className="symbol-display">{'<'}</span>
              <span className="symbol-value">10</span>
            </button>
            <button
              className="symbol-button"
              onClick={() => handlePlaceSymbol('60')}
            >
              <span className="symbol-display">◯</span>
              <span className="symbol-value">60</span>
            </button>
          </div>

          <div className="action-buttons">
            <button className="reset-button" onClick={handleReset}>
              초기화
            </button>
            <button className="check-button" onClick={handleCheck}>
              확인
            </button>
          </div>

          {!showHint && attempts >= 2 && (
            <button
              className="hint-button"
              onClick={() => setShowHint(true)}
            >
              힌트 보기
            </button>
          )}

          {showHint && (
            <div className="hint-box">
              <p>힌트: {target} = 4 × 60 + 3 × 10</p>
              <p>60 기호 4개와 10 기호 3개가 필요합니다!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
