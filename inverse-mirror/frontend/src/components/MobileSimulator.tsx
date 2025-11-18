import React from 'react';
import { calculateDerivative, evaluateFunction } from '../services/mathUtils';

interface MobileSimulatorProps {
  functionExpression: string;
  selectedPoint: number;
  showDerivative: boolean;
  showInverse: boolean;
}

const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  functionExpression,
  selectedPoint,
  showDerivative,
  showInverse,
}) => {
  const yValue = evaluateFunction(functionExpression, selectedPoint);
  const derivative = showDerivative ? calculateDerivative(functionExpression, selectedPoint) : null;
  const inverseDerivative = derivative && derivative !== 0 ? 1 / derivative : null;

  return (
    <div className="phone-simulator">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="phone-header">
          역함수 미분 학습
        </div>
        <div className="phone-content">
          <div style={{ padding: '10px' }}>
            <h3 style={{ fontSize: '1.1em', marginBottom: '15px', color: '#333' }}>
              📱 학습 내용
            </h3>

            <div style={{
              background: '#f0f7ff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.85em'
            }}>
              <strong>함수:</strong>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '1.1em',
                marginTop: '5px',
                color: '#2196F3'
              }}>
                f(x) = {functionExpression}
              </div>
            </div>

            <div style={{
              background: '#fff3e0',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.85em'
            }}>
              <strong>선택된 점:</strong>
              <div style={{ marginTop: '5px' }}>
                x = {selectedPoint.toFixed(2)}<br />
                f(x) = {yValue.toFixed(3)}
              </div>
            </div>

            {showDerivative && derivative !== null && (
              <>
                <div style={{
                  background: '#e8f5e9',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '0.85em'
                }}>
                  <strong>미분계수:</strong>
                  <div style={{ marginTop: '5px', color: '#4CAF50', fontWeight: 'bold' }}>
                    f'({selectedPoint.toFixed(2)}) = {derivative.toFixed(3)}
                  </div>
                </div>

                {showInverse && inverseDerivative !== null && isFinite(inverseDerivative) && (
                  <div style={{
                    background: '#ffebee',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '0.85em'
                  }}>
                    <strong>역함수 미분계수:</strong>
                    <div style={{ marginTop: '5px', color: '#FF5722', fontWeight: 'bold' }}>
                      (f⁻¹)'({yValue.toFixed(3)}) = {inverseDerivative.toFixed(3)}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      fontSize: '0.9em'
                    }}>
                      <strong>관계식:</strong><br />
                      (f⁻¹)'(y) = 1 / f'(x)
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{
              background: '#f3e5f5',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.8em',
              marginTop: '15px'
            }}>
              <strong>💡 핵심 개념</strong>
              <ul style={{ marginTop: '8px', marginLeft: '20px', lineHeight: '1.6' }}>
                <li>함수와 역함수는 y=x에 대해 대칭</li>
                <li>역함수의 미분은 원함수 미분의 역수</li>
                {showDerivative && derivative !== null && (
                  <li>
                    {derivative.toFixed(3)} × {inverseDerivative?.toFixed(3)}
                    {inverseDerivative && ` = ${(derivative * inverseDerivative).toFixed(3)}`}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSimulator;
