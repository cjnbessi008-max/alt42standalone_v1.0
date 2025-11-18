/**
 * App Component
 * Graph Emotion 앱 메인 컴포넌트
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraphEmotion } from './components/GraphEmotion/GraphEmotion';
import { VirtualPhone } from './components/VirtualPhone/VirtualPhone';
import { useGraphData } from './hooks/useGraphData';
import { LMSProblem, ConceptCategory } from './types/graph.types';

function App() {
  const { graphData, lmsProblems, loading, fetchLMSProblems, simulateProgress } = useGraphData();
  const [showLMSPanel, setShowLMSPanel] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId);
    simulateProgress(nodeId);
  };

  const getCategoryLabel = (category: ConceptCategory): string => {
    const labels: Record<ConceptCategory, string> = {
      [ConceptCategory.Foundation]: '기초',
      [ConceptCategory.Core]: '핵심',
      [ConceptCategory.Advanced]: '심화',
      [ConceptCategory.Application]: '응용',
    };
    return labels[category];
  };

  const getCategoryColor = (category: ConceptCategory): string => {
    const colors: Record<ConceptCategory, string> = {
      [ConceptCategory.Foundation]: 'bg-blue-100 text-blue-700',
      [ConceptCategory.Core]: 'bg-green-100 text-green-700',
      [ConceptCategory.Advanced]: 'bg-orange-100 text-orange-700',
      [ConceptCategory.Application]: 'bg-purple-100 text-purple-700',
    };
    return colors[category];
  };

  return (
    <div className="app min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Graph Emotion</h1>
              <p className="text-gray-600">
                그래프의 전체 성격을 감정 표현으로 보여주는 AI 교육 시스템
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLMSPanel(!showLMSPanel)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              LMS 문제 목록
            </motion.button>
          </div>
        </motion.header>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 정보 패널 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* 감정 표현 안내 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">감정 표현 시스템</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🌡️</span>
                    온도 (Temperature)
                  </h3>
                  <p className="text-sm text-gray-600">
                    난이도를 색상 온도로 표현합니다. 파란색(차가움)은 쉬운 문제, 빨간색(뜨거움)은
                    어려운 문제를 나타냅니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    색감 (Color)
                  </h3>
                  <p className="text-sm text-gray-600">
                    개념 카테고리와 완성도를 색상으로 표현합니다. 진행률에 따라 그라디언트가
                    변합니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎵</span>
                    리듬 (Rhythm)
                  </h3>
                  <p className="text-sm text-gray-600">
                    학습 진행 상태를 맥박 애니메이션으로 표현합니다. 진행 중인 노드는 리듬감 있게
                    움직입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">학습 통계</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">전체 개념</span>
                  <span className="font-bold text-2xl text-gray-800">{graphData.nodes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">완료한 개념</span>
                  <span className="font-bold text-2xl text-green-600">
                    {graphData.nodes.filter((n) => n.completed).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">진행 중</span>
                  <span className="font-bold text-2xl text-yellow-600">
                    {graphData.nodes.filter((n) => !n.completed && n.progress > 0).length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (graphData.nodes.filter((n) => n.completed).length /
                          graphData.nodes.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 사용 방법 */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-3">💡 사용 방법</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>1️⃣</span>
                  <span>노드를 클릭하여 상세 정보를 확인하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2️⃣</span>
                  <span>노드를 드래그하여 위치를 조정할 수 있습니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3️⃣</span>
                  <span>맥박 효과가 있는 노드는 현재 진행 중입니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>4️⃣</span>
                  <span>우측 하단 스마트폰에서도 확인 가능합니다</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* 중앙: 데스크톱 그래프 뷰 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">개념 관계 그래프</h2>
              <div className="flex justify-center">
                <GraphEmotion
                  data={graphData}
                  width={700}
                  height={600}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* LMS 문제 패널 (슬라이드인) */}
      {showLMSPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLMSPanel(false)}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">LMS 문제 목록</h2>
                <button
                  onClick={() => setShowLMSPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-4 text-gray-600">문제 로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lmsProblems.map((problem) => (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{problem.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(
                            problem.category
                          )}`}
                        >
                          {getCategoryLabel(problem.category)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{problem.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>난이도:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-red-400 h-2 rounded-full"
                            style={{ width: `${problem.difficulty * 100}%` }}
                          />
                        </div>
                        <span>{Math.round(problem.difficulty * 100)}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <button
                onClick={fetchLMSProblems}
                disabled={loading}
                className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? '로딩 중...' : '문제 새로고침'}
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* 가상 스마트폰 (우측 하단) */}
      <VirtualPhone>
        <GraphEmotion data={graphData} width={400} height={600} onNodeClick={handleNodeClick} />
      </VirtualPhone>
    </div>
  );
}

export default App;
