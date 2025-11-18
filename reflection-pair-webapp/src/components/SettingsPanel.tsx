import { useState } from 'react';
import { useReflectionPair } from '../hooks/useReflectionPair';
import { BasePresetOption } from '../types';

const BASE_PRESETS: BasePresetOption[] = [
  { label: 'e (자연로그)', value: 'e', baseNumber: Math.E, description: '자연 상수 e ≈ 2.718' },
  { label: '2 (이진로그)', value: '2', baseNumber: 2, description: '컴퓨터 과학에서 사용' },
  { label: '10 (상용로그)', value: '10', baseNumber: 10, description: '일반적인 로그' },
  { label: '사용자 정의', value: 'custom', baseNumber: 3, description: '직접 입력' },
];

export const SettingsPanel: React.FC = () => {
  const { config, updateConfig } = useReflectionPair();
  const [isOpen, setIsOpen] = useState(false);
  const [customBase, setCustomBase] = useState(config.baseNumber.toString());

  const handlePresetChange = (preset: BasePresetOption) => {
    if (preset.value === 'custom') {
      const base = parseFloat(customBase);
      if (!isNaN(base) && base > 0 && base !== 1) {
        updateConfig({ baseNumber: base });
      }
    } else {
      updateConfig({ baseNumber: preset.baseNumber });
      setCustomBase(preset.baseNumber.toString());
    }
  };

  const handleCustomBaseChange = (value: string) => {
    setCustomBase(value);
    const base = parseFloat(value);
    if (!isNaN(base) && base > 0 && base !== 1) {
      updateConfig({ baseNumber: base });
    }
  };

  const toggleGrid = () => {
    updateConfig({ showGrid: !config.showGrid });
  };

  const toggleAxes = () => {
    updateConfig({ showAxes: !config.showAxes });
  };

  return (
    <div className="fixed top-5 left-5 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-br from-purple-600 to-purple-800 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
      >
        {isOpen ? '✕ 닫기' : '⚙️ 설정'}
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="mt-3 bg-white rounded-lg shadow-2xl p-5 w-80 max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4">시각화 설정</h3>

          {/* Base number selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              밑(Base) 선택
            </label>
            <div className="space-y-2">
              {BASE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetChange(preset)}
                  className={`w-full text-left px-3 py-2 rounded border transition-all duration-200 ${
                    Math.abs(config.baseNumber - preset.baseNumber) < 0.01
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-gray-600">{preset.description}</div>
                </button>
              ))}
            </div>

            {/* Custom base input */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                사용자 정의 밑 (0 제외, 1 제외)
              </label>
              <input
                type="number"
                value={customBase}
                onChange={(e) => handleCustomBaseChange(e.target.value)}
                step="0.1"
                min="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="예: 3"
              />
            </div>
          </div>

          {/* Display options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              표시 옵션
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={toggleGrid}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                />
                <span className="text-sm text-gray-700">격자 표시</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showAxes}
                  onChange={toggleAxes}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                />
                <span className="text-sm text-gray-700">좌표축 표시</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showReflectionLine}
                  onChange={() => updateConfig({ showReflectionLine: !config.showReflectionLine })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                />
                <span className="text-sm text-gray-700">반사선 (y=x) 표시</span>
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <p className="font-semibold mb-1">💡 사용 방법:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>드래그: 그래프 이동</li>
              <li>스크롤: 확대/축소</li>
              <li>우측 하단: 스마트폰 화면</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
