/**
 * KTM Math Planet - NLP Input Component
 * Natural language input for teacher requests
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface NLPInputProps {
  onSubmit: (request: string) => void;
  initialValue?: string;
}

export const NLPInput: React.FC<NLPInputProps> = ({ onSubmit, initialValue = '' }) => {
  const [request, setRequest] = useState(initialValue);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  const examples = {
    ko: [
      '3학년 학생들을 위한 분수 학습 모듈을 만들어주세요. 학생들이 분수의 개념을 시각적으로 이해하고, 분수의 덧셈과 뺄셈을 연습할 수 있어야 합니다.',
      '곱셈구구를 재미있게 배울 수 있는 게임형 학습 모듈을 만들어주세요. 2단부터 9단까지 포함하고, 학생이 직접 문제를 풀 수 있어야 합니다.',
      '소수와 분수의 관계를 이해하는 모듈을 만들어주세요. 소수를 분수로, 분수를 소수로 변환하는 연습이 포함되어야 합니다.'
    ],
    en: [
      'Create a fractions learning module for 3rd grade students. Students should be able to visually understand fractions and practice addition and subtraction.',
      'Create a game-based multiplication tables learning module from 2x to 9x where students can solve problems interactively.',
      'Create a module that helps understand the relationship between decimals and fractions, including conversion practice.'
    ]
  };

  const handleSubmit = () => {
    if (request.trim()) {
      onSubmit(request);
    }
  };

  const handleExampleClick = (example: string) => {
    setRequest(example);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          🔭 어떤 교육 모듈을 만들고 싶으신가요?
        </h2>
        <p className="text-gray-300">
          자연어로 자유롭게 설명해주세요. AI가 이해하고 세계관을 재구성합니다.
        </p>
      </div>

      {/* Language Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setLanguage('ko')}
            className={`px-6 py-2 rounded-lg transition ${
              language === 'ko'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-2 rounded-lg transition ${
              language === 'en'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder={
            language === 'ko'
              ? '예: 3학년 학생들을 위한 분수 학습 모듈을 만들어주세요...'
              : 'e.g., Create a fractions learning module for 3rd grade students...'
          }
          className="w-full h-48 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 transition"
        />
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-gray-400">
            {request.length} {language === 'ko' ? '글자' : 'characters'}
          </span>
          <span className="text-gray-400">
            {language === 'ko' ? '최소 50자 이상 권장' : 'Minimum 50 characters recommended'}
          </span>
        </div>
      </div>

      {/* Examples */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 {language === 'ko' ? '예시 보기' : 'Examples'}
        </h3>
        <div className="space-y-2">
          {examples[language].map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-lg transition text-gray-300 hover:text-white"
            >
              <span className="text-blue-400 mr-2">예시 {index + 1}:</span>
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={request.length < 10}
          className={`px-12 py-4 rounded-lg font-semibold text-lg transition ${
            request.length >= 10
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          🚀 {language === 'ko' ? 'AI 탐험 시작하기' : 'Start AI Discovery'}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">
          💡 {language === 'ko' ? '작성 팁' : 'Writing Tips'}
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• {language === 'ko' ? '학년 또는 대상 연령을 명시하세요' : 'Specify the grade level or target age'}</li>
          <li>• {language === 'ko' ? '학습 목표를 구체적으로 설명하세요' : 'Describe learning objectives specifically'}</li>
          <li>• {language === 'ko' ? '선호하는 학습 방식이나 예시를 포함하세요' : 'Include preferred learning methods or examples'}</li>
          <li>• {language === 'ko' ? '제약사항이 있다면 함께 알려주세요' : 'Mention any constraints if applicable'}</li>
        </ul>
      </div>
    </motion.div>
  );
};
