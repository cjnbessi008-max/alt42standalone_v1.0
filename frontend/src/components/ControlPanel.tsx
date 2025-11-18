import { useState } from 'react';
import { MoodleActivity, ScanState } from '../types';

interface ControlPanelProps {
  isConnected: boolean;
  activities: MoodleActivity[];
  selectedActivity: MoodleActivity | null;
  scanState: ScanState;
  onLoadActivities: (courseId: number) => void;
  onSelectActivity: (activity: MoodleActivity) => void;
  onStartScan: () => void;
  onPauseScan: () => void;
  onStopScan: () => void;
  onSpeedChange: (speed: number) => void;
}

const ControlPanel = ({
  isConnected,
  activities,
  selectedActivity,
  scanState,
  onLoadActivities,
  onSelectActivity,
  onStartScan,
  onPauseScan,
  onStopScan,
  onSpeedChange,
}: ControlPanelProps) => {
  const [courseId, setCourseId] = useState<string>('1');

  const handleLoadActivities = () => {
    const id = parseInt(courseId);
    if (id > 0) {
      onLoadActivities(id);
    }
  };

  const speedOptions = [
    { value: 1000, label: '빠름 (1초)' },
    { value: 2000, label: '보통 (2초)' },
    { value: 3000, label: '느림 (3초)' },
    { value: 5000, label: '매우 느림 (5초)' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">제어판</h2>

      {/* 연결 상태 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Moodle 연결 상태</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? '연결됨' : '연결 안 됨'}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Moodle 3.7 | PHP 7.1.9 | MySQL 5.7
        </div>
      </div>

      {/* 코스 로드 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          코스 ID
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="코스 ID 입력"
            min="1"
          />
          <button
            onClick={handleLoadActivities}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!isConnected}
          >
            로드
          </button>
        </div>
      </div>

      {/* 활동 선택 */}
      {activities.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            활동 선택 ({activities.length}개)
          </label>
          <select
            value={selectedActivity?.id || ''}
            onChange={(e) => {
              const activity = activities.find((a) => a.id === parseInt(e.target.value));
              if (activity) onSelectActivity(activity);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">활동을 선택하세요</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                [{activity.modulename}] {activity.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 스캔 속도 조절 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          스캔 속도
        </label>
        <select
          value={scanState.speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={scanState.isScanning && !scanState.isPaused}
        >
          {speedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 스캔 컨트롤 버튼 */}
      <div className="space-y-3">
        <button
          onClick={onStartScan}
          disabled={!selectedActivity || scanState.isScanning || !selectedActivity?.conditions?.length}
          className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          스캔 시작
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPauseScan}
            disabled={!scanState.isScanning}
            className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {scanState.isPaused ? '재개' : '일시정지'}
          </button>

          <button
            onClick={onStopScan}
            disabled={!scanState.isScanning}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            중지
          </button>
        </div>
      </div>

      {/* 상태 정보 */}
      {scanState.isScanning && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-800 mb-2">스캔 정보</div>
          <div className="space-y-1 text-sm text-blue-700">
            <div>현재 인덱스: {scanState.currentIndex + 1}</div>
            <div>속도: {scanState.speed / 1000}초</div>
            <div>상태: {scanState.isPaused ? '일시정지' : '실행 중'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
