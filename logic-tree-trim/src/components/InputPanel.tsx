/**
 * InputPanel Component
 * 논리식 입력 패널
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InputPanelProps {
  onSubmit: (expression: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const examples = [
    'A AND B',
    'A OR (B AND C)',
    'NOT (A AND B)',
    '(A OR B) AND (NOT A OR NOT B)',
    'A AND NOT A',
    'A OR TRUE',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('논리식을 입력해주세요.');
      return;
    }

    try {
      onSubmit(input);
      setError('');
    } catch (err) {
      setError('올바른 논리식을 입력해주세요.');
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    setError('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Logic Tree Trim</h2>
        <p className="text-gray-600 mb-6">논리식 단순화 과정을 나무 가지치기처럼 시각화합니다</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              논리식 입력
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder="예: A AND (B OR NOT C)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-indigo-500 focus:outline-none
                       font-mono text-lg"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">예제:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg
                           hover:bg-indigo-200 transition-colors text-sm font-mono"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                     text-white font-bold text-lg rounded-lg
                     hover:from-indigo-700 hover:to-purple-700
                     transition-all transform hover:scale-105 shadow-lg"
          >
            단순화 시작 →
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 font-semibold mb-2">지원 연산자:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <span className="font-mono">AND</span>, <span className="font-mono">&</span> - 논리곱</li>
            <li>• <span className="font-mono">OR</span>, <span className="font-mono">|</span> - 논리합</li>
            <li>• <span className="font-mono">NOT</span>, <span className="font-mono">!</span> - 부정</li>
            <li>• <span className="font-mono">()</span> - 괄호로 우선순위 지정</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};
