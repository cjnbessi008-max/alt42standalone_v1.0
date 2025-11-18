import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoodleActivity, ScanState, Condition, HighlightedCondition } from '../types';

interface ConditionScannerProps {
  activity: MoodleActivity | null;
  scanState: ScanState;
  onScanStateChange: (state: ScanState) => void;
}

const ConditionScanner = ({ activity, scanState, onScanStateChange }: ConditionScannerProps) => {
  const [conditions, setConditions] = useState<HighlightedCondition[]>([]);

  useEffect(() => {
    if (activity?.conditions) {
      const highlightedConditions = activity.conditions.map((condition, index) => ({
        ...condition,
        isHighlighted: scanState.currentIndex === index,
        wasScanned: scanState.currentIndex > index,
      }));
      setConditions(highlightedConditions);
    } else {
      setConditions([]);
    }
  }, [activity, scanState.currentIndex]);

  useEffect(() => {
    if (!scanState.isScanning || scanState.isPaused || !activity?.conditions) {
      return;
    }

    const timer = setTimeout(() => {
      if (scanState.currentIndex < (activity.conditions?.length || 0) - 1) {
        onScanStateChange({
          ...scanState,
          currentIndex: scanState.currentIndex + 1,
        });
      } else {
        // 스캔 완료
        onScanStateChange({
          ...scanState,
          isScanning: false,
          currentIndex: 0,
        });
      }
    }, scanState.speed);

    return () => clearTimeout(timer);
  }, [scanState, activity, onScanStateChange]);

  const renderConditionType = (type: string) => {
    const typeColors: { [key: string]: string } = {
      completion: 'bg-blue-100 text-blue-800',
      grade: 'bg-green-100 text-green-800',
      date: 'bg-purple-100 text-purple-800',
      group: 'bg-yellow-100 text-yellow-800',
      user: 'bg-pink-100 text-pink-800',
      custom: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${typeColors[type] || typeColors.custom}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const renderConditionTree = (condition: HighlightedCondition, depth: number = 0) => {
    return (
      <motion.div
        key={condition.id}
        className={`mb-3 ${depth > 0 ? 'ml-6 border-l-4 border-gray-300 pl-4' : ''}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
            condition.isHighlighted
              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
              : condition.wasScanned
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {renderConditionType(condition.type)}
                {condition.operator && (
                  <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {condition.operator}
                  </span>
                )}
              </div>
              <p className="text-gray-800 font-medium">{condition.description}</p>
              {condition.value && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold">값:</span> {condition.value}
                </div>
              )}
            </div>

            {/* 상태 표시 */}
            <div className="flex-shrink-0">
              {condition.isHighlighted ? (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              ) : condition.wasScanned ? (
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* 중첩 조건 */}
          {condition.nested && condition.nested.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-blue-300">
              {condition.nested.map((nested) => (
                <div key={nested.id} className="mb-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">→</span>
                    <span>{nested.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (!activity) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">활동을 선택하세요</h3>
        <p className="text-sm text-gray-500">Moodle 활동을 선택하면 조건 스캔을 시작할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">조건 분석</h2>
          {scanState.isScanning && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-800">스캔 중...</span>
            </div>
          )}
        </div>

        {/* 진행 상황 표시 */}
        {activity.conditions && activity.conditions.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>진행 상황</span>
              <span>
                {scanState.isScanning ? scanState.currentIndex + 1 : 0} / {activity.conditions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    scanState.isScanning
                      ? ((scanState.currentIndex + 1) / activity.conditions.length) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* 활동 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">활동 이름</div>
          <div className="font-semibold text-gray-900">{activity.name}</div>
          <div className="text-sm text-gray-500 mt-2">
            모듈 타입: {activity.modulename} | ID: {activity.id}
          </div>
        </div>
      </div>

      {/* 조건 목록 */}
      <div className="space-y-4">
        {conditions.length > 0 ? (
          conditions.map((condition) => renderConditionTree(condition))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>이 활동에는 접근 조건이 설정되지 않았습니다.</p>
          </div>
        )}
      </div>

      {/* 스캔 완료 메시지 */}
      {!scanState.isScanning && scanState.currentIndex === 0 && conditions.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800 font-semibold">
            {conditions.filter((c) => c.wasScanned).length === conditions.length
              ? '모든 조건 스캔이 완료되었습니다!'
              : '스캔을 시작하려면 "시작" 버튼을 클릭하세요.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConditionScanner;
