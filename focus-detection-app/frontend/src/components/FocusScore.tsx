import React from 'react';
import { FocusData } from '@/types';
import { getFocusLevel, getFocusColor, getFocusMessage } from '@/utils/focusCalculator';

interface FocusScoreProps {
  focusData: FocusData | null;
  className?: string;
}

export const FocusScore: React.FC<FocusScoreProps> = ({ focusData, className = '' }) => {
  if (!focusData) {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          집중도 측정 대기 중...
        </div>
      </div>
    );
  }

  const level = getFocusLevel(focusData.score);
  const color = getFocusColor(focusData.score);
  const message = getFocusMessage(focusData.score);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* 메인 점수 */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold mb-2" style={{ color }}>
          {Math.round(focusData.score)}
        </div>
        <div className="text-lg text-gray-600">집중도 점수</div>
        <div className="text-sm mt-2 font-medium" style={{ color }}>
          {message}
        </div>
      </div>

      {/* 점수 바 */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${focusData.score}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="space-y-3">
        <ScoreItem
          label="얼굴 감지"
          value={focusData.faceDetected ? 30 : 0}
          max={30}
          icon="👤"
        />
        <ScoreItem
          label="시선 방향"
          value={focusData.gazeScore}
          max={40}
          icon="👁️"
        />
        <ScoreItem
          label="고개 방향"
          value={focusData.headPoseScore}
          max={20}
          icon="🎯"
        />
        <ScoreItem
          label="움직임"
          value={focusData.movementScore}
          max={10}
          icon="📍"
        />
      </div>

      {/* 추가 정보 */}
      {!focusData.faceDetected && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          ⚠️ 얼굴이 감지되지 않습니다. 카메라 앞에 위치해주세요.
        </div>
      )}
    </div>
  );
};

interface ScoreItemProps {
  label: string;
  value: number;
  max: number;
  icon: string;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, value, max, icon }) => {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">
          {icon} {label}
        </span>
        <span className="text-sm font-medium">
          {Math.round(value)}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
