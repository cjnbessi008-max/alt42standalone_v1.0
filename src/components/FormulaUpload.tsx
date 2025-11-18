import React, { useState } from 'react';
import { Formula, FormulaCategory } from '../types';
import { parseFormula, sampleFormulas, categories } from '../utils/formulaParser';
import { isFormulaCompleted } from '../utils/stats';
import { motion } from 'framer-motion';

interface FormulaUploadProps {
  onFormulaSelect: (formula: Formula) => void;
  onViewStats: () => void;
}

export const FormulaUpload: React.FC<FormulaUploadProps> = ({ onFormulaSelect, onViewStats }) => {
  const [customText, setCustomText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTextSubmit = () => {
    if (customText.trim()) {
      const formula: Formula = {
        id: `custom-${Date.now()}`,
        imageUrl: '',
        text: customText,
        name: '사용자 정의 공식',
        components: parseFormula(customText)
      };
      onFormulaSelect(formula);
    }
  };

  // 필터링된 공식들
  const filteredFormulas = sampleFormulas.filter((formula) => {
    const matchesCategory = selectedCategory === 'all' || formula.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      formula.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 난이도별 색상
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return '일반';
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8 my-8">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              수학 공식 학습 앱
            </h1>
            <p className="text-gray-600">
              반복 학습으로 공식을 완벽하게 기억하세요
            </p>
          </div>
          <button
            onClick={onViewStats}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            📊 학습 통계
          </button>
        </div>

        {/* 직접 입력 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ✏️ 공식 직접 입력
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
            >
              학습 시작
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 공식 검색..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({sampleFormulas.length})
            </button>
            {categories.map((category) => {
              const count = sampleFormulas.filter((f) => f.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 카테고리 설명 */}
        {selectedCategory !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {categories.find((c) => c.id === selectedCategory)?.icon}
              </span>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {categories.find((c) => c.id === selectedCategory)?.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 공식 목록 */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">😅</p>
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            filteredFormulas.map((formula) => {
              const isCompleted = isFormulaCompleted(formula.id);
              return (
                <motion.button
                  key={formula.id}
                  onClick={() => onFormulaSelect(formula)}
                  className="w-full p-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-lg transition-all border border-indigo-200 hover:border-indigo-300 text-left group relative"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* 완료 배지 */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      ✓ 완료
                    </div>
                  )}

                  {/* 공식 이름 */}
                  {formula.name && (
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {formula.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(
                          formula.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(formula.difficulty)}
                      </span>
                    </div>
                  )}

                  {/* 공식 */}
                  <div className="text-xl md:text-2xl font-mono text-gray-800 mb-2">
                    {formula.text}
                  </div>

                  {/* 설명 */}
                  {formula.description && (
                    <p className="text-sm text-gray-600">{formula.description}</p>
                  )}
                </motion.button>
              );
            })
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>초급: {sampleFormulas.filter((f) => f.difficulty === 'beginner').length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">●</span>
              <span>중급: {sampleFormulas.filter((f) => f.difficulty === 'intermediate').length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500">●</span>
              <span>고급: {sampleFormulas.filter((f) => f.difficulty === 'advanced').length}개</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
