/**
 * useGraphData Hook
 * 그래프 데이터를 관리하고 LMS 시뮬레이션 데이터 제공
 */

import { useState, useEffect } from 'react';
import {
  GraphData,
  GraphNode,
  GraphEdge,
  ConceptCategory,
  RelationType,
  LMSProblem,
  StudentProgress,
} from '../types/graph.types';

/**
 * 샘플 LMS 데이터 생성
 */
function generateSampleLMSData(): LMSProblem[] {
  return [
    {
      id: 'prob-1',
      title: '분수의 기본 개념',
      description: '분수의 정의와 표현 방법 학습',
      concepts: ['fraction-basics'],
      difficulty: 0.2,
      category: ConceptCategory.Foundation,
    },
    {
      id: 'prob-2',
      title: '분수의 덧셈',
      description: '같은 분모를 가진 분수의 덧셈',
      concepts: ['fraction-basics', 'fraction-addition'],
      difficulty: 0.4,
      category: ConceptCategory.Core,
    },
    {
      id: 'prob-3',
      title: '분수의 뺄셈',
      description: '같은 분모를 가진 분수의 뺄셈',
      concepts: ['fraction-basics', 'fraction-subtraction'],
      difficulty: 0.4,
      category: ConceptCategory.Core,
    },
    {
      id: 'prob-4',
      title: '다른 분모 분수의 덧셈',
      description: '다른 분모를 가진 분수의 덧셈 (통분)',
      concepts: ['fraction-addition', 'common-denominator'],
      difficulty: 0.7,
      category: ConceptCategory.Advanced,
    },
    {
      id: 'prob-5',
      title: '분수의 곱셈',
      description: '분수의 곱셈 원리와 계산',
      concepts: ['fraction-multiplication'],
      difficulty: 0.6,
      category: ConceptCategory.Advanced,
    },
    {
      id: 'prob-6',
      title: '분수의 나눗셈',
      description: '분수의 나눗셈 (역수 활용)',
      concepts: ['fraction-multiplication', 'fraction-division'],
      difficulty: 0.8,
      category: ConceptCategory.Advanced,
    },
    {
      id: 'prob-7',
      title: '실생활 분수 문제',
      description: '분수를 활용한 실생활 문제 해결',
      concepts: [
        'fraction-addition',
        'fraction-subtraction',
        'fraction-multiplication',
        'fraction-division',
      ],
      difficulty: 0.9,
      category: ConceptCategory.Application,
    },
  ];
}

/**
 * 샘플 그래프 데이터 생성
 */
function generateSampleGraphData(): GraphData {
  const nodes: GraphNode[] = [
    {
      id: 'fraction-basics',
      label: '분수 기본',
      category: ConceptCategory.Foundation,
      difficulty: 0.2,
      completed: true,
      progress: 100,
    },
    {
      id: 'fraction-addition',
      label: '분수 덧셈',
      category: ConceptCategory.Core,
      difficulty: 0.4,
      completed: true,
      progress: 100,
    },
    {
      id: 'fraction-subtraction',
      label: '분수 뺄셈',
      category: ConceptCategory.Core,
      difficulty: 0.4,
      completed: false,
      progress: 60,
    },
    {
      id: 'common-denominator',
      label: '통분',
      category: ConceptCategory.Advanced,
      difficulty: 0.7,
      completed: false,
      progress: 30,
    },
    {
      id: 'fraction-multiplication',
      label: '분수 곱셈',
      category: ConceptCategory.Advanced,
      difficulty: 0.6,
      completed: false,
      progress: 0,
    },
    {
      id: 'fraction-division',
      label: '분수 나눗셈',
      category: ConceptCategory.Advanced,
      difficulty: 0.8,
      completed: false,
      progress: 0,
    },
    {
      id: 'real-world-application',
      label: '실생활 응용',
      category: ConceptCategory.Application,
      difficulty: 0.9,
      completed: false,
      progress: 0,
    },
  ];

  const edges: GraphEdge[] = [
    {
      source: 'fraction-basics',
      target: 'fraction-addition',
      strength: 0.9,
      type: RelationType.Prerequisite,
    },
    {
      source: 'fraction-basics',
      target: 'fraction-subtraction',
      strength: 0.9,
      type: RelationType.Prerequisite,
    },
    {
      source: 'fraction-addition',
      target: 'common-denominator',
      strength: 0.8,
      type: RelationType.Prerequisite,
    },
    {
      source: 'fraction-basics',
      target: 'fraction-multiplication',
      strength: 0.7,
      type: RelationType.Prerequisite,
    },
    {
      source: 'fraction-multiplication',
      target: 'fraction-division',
      strength: 0.8,
      type: RelationType.Prerequisite,
    },
    {
      source: 'fraction-addition',
      target: 'real-world-application',
      strength: 0.6,
      type: RelationType.Related,
    },
    {
      source: 'fraction-subtraction',
      target: 'real-world-application',
      strength: 0.6,
      type: RelationType.Related,
    },
    {
      source: 'fraction-multiplication',
      target: 'real-world-application',
      strength: 0.7,
      type: RelationType.Related,
    },
    {
      source: 'fraction-division',
      target: 'real-world-application',
      strength: 0.7,
      type: RelationType.Related,
    },
    {
      source: 'fraction-addition',
      target: 'fraction-subtraction',
      strength: 0.5,
      type: RelationType.Similar,
    },
  ];

  return { nodes, edges };
}

/**
 * Graph Data Hook
 */
export function useGraphData() {
  const [graphData, setGraphData] = useState<GraphData>(generateSampleGraphData());
  const [lmsProblems, setLmsProblems] = useState<LMSProblem[]>(generateSampleLMSData());
  const [loading, setLoading] = useState(false);

  /**
   * LMS에서 새로운 문제 데이터 가져오기 (시뮬레이션)
   */
  const fetchLMSProblems = async () => {
    setLoading(true);
    // 실제 환경에서는 API 호출
    // const response = await fetch('/api/lms/problems');
    // const data = await response.json();

    // 시뮬레이션: 1초 지연
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLmsProblems(generateSampleLMSData());
    setLoading(false);
  };

  /**
   * 학생 진행 상황 업데이트
   */
  const updateStudentProgress = (progress: StudentProgress) => {
    setGraphData((prevData) => ({
      ...prevData,
      nodes: prevData.nodes.map((node) =>
        node.id === progress.nodeId
          ? {
              ...node,
              completed: progress.completed,
              progress: progress.score,
            }
          : node
      ),
    }));
  };

  /**
   * 노드 클릭 시 진행률 시뮬레이션
   */
  const simulateProgress = (nodeId: string) => {
    setGraphData((prevData) => ({
      ...prevData,
      nodes: prevData.nodes.map((node) => {
        if (node.id === nodeId) {
          const newProgress = Math.min(100, node.progress + 20);
          return {
            ...node,
            progress: newProgress,
            completed: newProgress === 100,
          };
        }
        return node;
      }),
    }));
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    fetchLMSProblems();
  }, []);

  return {
    graphData,
    lmsProblems,
    loading,
    fetchLMSProblems,
    updateStudentProgress,
    simulateProgress,
  };
}
