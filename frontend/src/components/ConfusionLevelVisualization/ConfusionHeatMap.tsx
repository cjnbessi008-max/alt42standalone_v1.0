/**
 * Confusion Heat Map Component
 *
 * Displays a heat map of confusion levels across different concepts
 */

import React from 'react';
import { ConceptConfusion } from '../../types/confusion';

interface ConfusionHeatMapProps {
  concepts: ConceptConfusion[];
  onConceptClick?: (conceptId: string) => void;
  className?: string;
}

const ConfusionHeatMap: React.FC<ConfusionHeatMapProps> = ({
  concepts,
  onConceptClick,
  className = '',
}) => {
  if (concepts.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <p>아직 학습 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-2">개념별 혼란도</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {concepts.map((concept) => (
          <div
            key={concept.conceptId}
            className="p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: concept.color }}
            onClick={() => onConceptClick?.(concept.conceptId)}
          >
            <div className="text-white">
              <h4 className="font-bold text-sm mb-1">{concept.conceptName}</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-90">혼란도</span>
                <span className="text-2xl font-bold">{concept.confusionLevel}%</span>
              </div>
              <div className="mt-2 text-xs opacity-80">
                <p>시도 횟수: {concept.metrics.attemptCount}</p>
                <p>소요 시간: {Math.round(concept.metrics.timeSpent)}초</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfusionHeatMap;
