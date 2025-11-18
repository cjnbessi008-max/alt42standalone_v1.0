import React, { useState } from 'react';
import { parseInequality, getIntervalNotation } from '../utils/inequalityParser';
import { useStore } from '../store/useStore';

/**
 * 부등식 입력 및 파싱 컴포넌트
 */
export const InequalityInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { inequality, setInequality } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) {
      setError('부등식을 입력해주세요.');
      return;
    }

    const parsed = parseInequality(input);
    if (parsed) {
      setInequality(parsed);
      setError(null);
    } else {
      setError('올바른 부등식 형식이 아닙니다. 예: x > 2, -3 <= x < 5');
    }
  };

  const examples = [
    'x > 2',
    'x >= -3',
    'x < 5',
    'x <= 7',
    '-3 <= x < 5',
    '2 < x <= 8',
  ];

  const handleExampleClick = (example: string) => {
    setInput(example);
    const parsed = parseInequality(example);
    if (parsed) {
      setInequality(parsed);
      setError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">부등식 입력</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inequality" className="block text-sm font-medium text-gray-700 mb-2">
            부등식을 입력하세요
          </label>
          <div className="flex gap-2">
            <input
              id="inequality"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: x > 2 또는 -3 <= x < 5"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              시각화
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* 예시 버튼들 */}
        <div>
          <p className="text-sm text-gray-600 mb-2">예시:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* 현재 부등식 정보 */}
      {inequality && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">현재 부등식</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">표현식:</span>{' '}
              <span className="font-mono">{inequality.expression}</span>
            </p>
            <p>
              <span className="font-medium">구간 표기법:</span>{' '}
              <span className="font-mono">{getIntervalNotation(inequality)}</span>
            </p>
            <p>
              <span className="font-medium">타입:</span> {inequality.type}
            </p>
          </div>
        </div>
      )}

      {/* 사용 방법 안내 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <h4 className="font-semibold mb-2">사용 방법:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>단순 부등식: <code className="bg-white px-1 rounded">x &gt; 2</code>, <code className="bg-white px-1 rounded">x &lt;= 5</code></li>
          <li>범위 부등식: <code className="bg-white px-1 rounded">-3 &lt;= x &lt; 5</code></li>
          <li>연산자: &gt;, &lt;, &gt;=, &lt;=</li>
          <li>스마트폰 화면에서 빛의 세기로 시각화됩니다</li>
        </ul>
      </div>
    </div>
  );
};
