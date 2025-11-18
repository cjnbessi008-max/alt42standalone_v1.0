import React, { useState } from 'react';
import { Formula } from '../types';
import { parseFormula, sampleFormulas } from '../utils/formulaParser';

interface FormulaUploadProps {
  onFormulaSelect: (formula: Formula) => void;
}

export const FormulaUpload: React.FC<FormulaUploadProps> = ({ onFormulaSelect }) => {
  const [customText, setCustomText] = useState('');

  const handleTextSubmit = () => {
    if (customText.trim()) {
      const formula: Formula = {
        id: `custom-${Date.now()}`,
        imageUrl: '',
        text: customText,
        components: parseFormula(customText)
      };
      onFormulaSelect(formula);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          수학 공식 학습 앱
        </h1>
        <p className="text-gray-600 text-center mb-8">
          공식을 반복적으로 떠올리며 장기 기억에 저장하세요
        </p>

        {/* 직접 입력 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수학 공식 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="예: a² + b² = c²"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!customText.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              시작
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            *현재 기본 문자식만 지원됩니다. 지수는 ² ³ 기호나 ^ 사용
          </p>
        </div>

        {/* 구분선 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는 예제 선택</span>
          </div>
        </div>

        {/* 예제 공식들 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예제 공식
          </label>
          {sampleFormulas.map((formula) => (
            <button
              key={formula.id}
              onClick={() => onFormulaSelect(formula)}
              className="w-full p-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg transition-all border border-indigo-200 hover:border-indigo-300 text-left group"
            >
              <div className="text-2xl font-mono text-gray-800 group-hover:text-blue-700 transition-colors text-center">
                {formula.text}
              </div>
            </button>
          ))}
        </div>

        {/* 이미지 업로드 (향후 구현) */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            📸 이미지 업로드 기능은 추후 업데이트 예정입니다
          </p>
        </div>
      </div>
    </div>
  );
};
