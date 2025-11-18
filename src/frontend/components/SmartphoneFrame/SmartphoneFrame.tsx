import React, { useState } from 'react';
import { ShapeMorphCanvas } from '../ShapeMorphCanvas/ShapeMorphCanvas';
import { ConceptShape } from '@types/shape.types';
import './SmartphoneFrame.css';

export interface SmartphoneFrameProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
  courseId?: number;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  position = 'bottom-right',
  size = 'medium',
  theme = 'light',
  courseId = 1,
}) => {
  const [currentConcept, setCurrentConcept] = useState<ConceptShape | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleConceptChange = (concept: ConceptShape) => {
    setCurrentConcept(concept);
    console.log('[SmartphoneFrame] Concept changed:', concept.name);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getConceptDisplayName = (concept: ConceptShape | null): string => {
    if (!concept) return '로딩 중...';

    const nameMap: Record<string, string> = {
      'fraction_half': '1/2 (반)',
      'fraction_third': '1/3 (삼분의 일)',
      'fraction_quarter': '1/4 (사분의 일)',
      'fraction_two_thirds': '2/3',
      'fraction_three_quarters': '3/4',
      'triangle': '삼각형',
      'square': '정사각형',
      'pentagon': '오각형',
      'hexagon': '육각형',
      'circle': '원',
    };

    return nameMap[concept.name] || concept.name;
  };

  return (
    <div
      className={`smartphone-frame ${position} ${size} ${theme} ${
        isMinimized ? 'minimized' : ''
      }`}
    >
      {/* 스마트폰 하드웨어 프레임 */}
      <div className="smartphone-bezel">
        {/* 상단 노치 */}
        <div className="smartphone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* 최소화 버튼 */}
        <button
          className="minimize-button"
          onClick={toggleMinimize}
          aria-label={isMinimized ? '확대' : '최소화'}
        >
          {isMinimized ? '▲' : '▼'}
        </button>

        {/* 스크린 영역 */}
        {!isMinimized && (
          <div className="smartphone-screen">
            {/* Shape Morph 캔버스 */}
            <div className="canvas-wrapper">
              <ShapeMorphCanvas
                courseId={courseId}
                autoStart={true}
                onConceptChange={handleConceptChange}
              />
            </div>

            {/* 하단 개념 레이블 */}
            <div className="concept-label">
              <span className="concept-name">
                {getConceptDisplayName(currentConcept)}
              </span>
              {currentConcept && (
                <span className="concept-category">
                  {currentConcept.category === 'fraction' ? '분수' : '기하학'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 하단 홈 인디케이터 */}
        {!isMinimized && <div className="smartphone-home-indicator"></div>}
      </div>
    </div>
  );
};
