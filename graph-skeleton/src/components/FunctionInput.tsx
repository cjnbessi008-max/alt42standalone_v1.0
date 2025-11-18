import React, { useState } from 'react';

interface FunctionInputProps {
  onAnalyze: (expression: string, domain: { min: number; max: number }) => void;
  isAnalyzing: boolean;
}

export const FunctionInput: React.FC<FunctionInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [expression, setExpression] = useState('x^2 - 4*x + 3');
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(expression, { min: xMin, max: xMax });
  };

  const exampleFunctions = [
    { label: '이차함수', expr: 'x^2 - 4*x + 3' },
    { label: '삼차함수', expr: 'x^3 - 6*x^2 + 9*x + 1' },
    { label: '사차함수', expr: 'x^4 - 4*x^3 + 4*x^2' },
    { label: '삼각함수', expr: 'sin(x) + cos(x)' },
    { label: '지수함수', expr: 'e^(-x^2/4)' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">함수 입력</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            함수 f(x) =
          </label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="예: x^2 - 4*x + 3"
            disabled={isAnalyzing}
          />
          <p className="text-xs text-gray-500 mt-1">
            연산자: + - * / ^ (거듭제곱), sin(), cos(), tan(), e, pi
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              x 최소값
            </label>
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isAnalyzing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              x 최대값
            </label>
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isAnalyzing}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnalyzing}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            isAnalyzing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-600'
          }`}
        >
          {isAnalyzing ? '분석 중...' : '그래프 분석 시작'}
        </button>
      </form>

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">예제 함수:</p>
        <div className="flex flex-wrap gap-2">
          {exampleFunctions.map((func, index) => (
            <button
              key={index}
              onClick={() => setExpression(func.expr)}
              disabled={isAnalyzing}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {func.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
