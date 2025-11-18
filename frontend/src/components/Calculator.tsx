import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calculator as CalcIcon, Play } from 'lucide-react';

export const Calculator = () => {
  const { testInput, setTestInput, calculateResult, calculationResult } = useStore();
  const [inputValue, setInputValue] = useState(testInput.toString());

  const handleCalculate = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      setTestInput(value);
      calculateResult();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalcIcon className="text-blue-500" size={24} />
        <h3 className="text-lg font-semibold">계산기</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            입력값 (x):
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="숫자를 입력하세요"
              step="any"
            />
            <button
              onClick={handleCalculate}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Play size={16} />
              계산
            </button>
          </div>
        </div>

        {calculationResult !== null && (
          <div className="result-display">
            <div className="text-sm text-gray-600 mb-1">결과:</div>
            <div className="text-3xl font-bold text-green-700">
              {calculationResult.toFixed(4)}
            </div>
          </div>
        )}

        {calculationResult !== null && !isFinite(calculationResult) && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700">
            ⚠️ 정의되지 않은 값입니다 (예: 0으로 나누기)
          </div>
        )}
      </div>
    </div>
  );
};
