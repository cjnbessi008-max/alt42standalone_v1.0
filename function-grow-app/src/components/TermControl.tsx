import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Term } from './FunctionGraph';

interface TermControlProps {
  onAddTerm: (term: Term) => void;
  onReset: () => void;
  currentTerms: Term[];
}

const TermControl: React.FC<TermControlProps> = ({ onAddTerm, onReset, currentTerms }) => {
  const [coefficient, setCoefficient] = useState<string>('1');
  const [power, setPower] = useState<string>('2');

  const handleAddTerm = () => {
    const coef = parseFloat(coefficient);
    const pow = parseInt(power);

    if (isNaN(coef) || isNaN(pow)) {
      alert('올바른 숫자를 입력해주세요!');
      return;
    }

    onAddTerm({ coefficient: coef, power: pow });
  };

  const quickTerms = [
    { label: 'x²', coef: 1, pow: 2 },
    { label: '2x', coef: 2, pow: 1 },
    { label: '+3', coef: 3, pow: 0 },
    { label: '-x²', coef: -1, pow: 2 },
    { label: 'x³', coef: 1, pow: 3 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Function Grow 🌱
        </h1>
        <p className="text-gray-600">
          함수의 항을 추가하며 그래프가 성장하는 모습을 관찰해보세요
        </p>
      </motion.div>

      {/* Current Terms Display */}
      {currentTerms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2">현재 항들:</h3>
          <div className="flex flex-wrap gap-2">
            {currentTerms.map((term, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white px-3 py-1 rounded-full shadow-sm"
              >
                <span className="text-sm font-mono font-semibold text-gray-800">
                  {term.coefficient > 0 && index > 0 ? '+' : ''}
                  {term.coefficient}
                  {term.power > 0 && 'x'}
                  {term.power > 1 && <sup>{term.power}</sup>}
                  {term.power === 0 && ''}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Custom Term Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">항 추가하기</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계수 (coefficient)
            </label>
            <input
              type="number"
              value={coefficient}
              onChange={(e) => setCoefficient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="예: 2"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              차수 (power)
            </label>
            <input
              type="number"
              value={power}
              onChange={(e) => setPower(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="예: 2"
              step="1"
              min="0"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddTerm}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              항 추가 ➕
            </button>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">빠른 추가:</h4>
          <div className="flex flex-wrap gap-2">
            {quickTerms.map((term, index) => (
              <button
                key={index}
                onClick={() => onAddTerm({ coefficient: term.coef, power: term.pow })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
              >
                {term.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reset Button */}
      {currentTerms.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            onClick={onReset}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            초기화 🔄
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TermControl;
