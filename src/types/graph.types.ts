/**
 * Graph Emotion Types
 * 그래프의 감정 표현을 위한 타입 정의
 */

export interface GraphNode {
  id: string;
  label: string;
  category: ConceptCategory;
  difficulty: number; // 0-1 (난이도)
  completed: boolean; // 완성 여부
  progress: number; // 0-100 (진행률)
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number; // 0-1 (관계 강도)
  type: RelationType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export enum ConceptCategory {
  Foundation = 'foundation', // 기초 개념
  Core = 'core', // 핵심 개념
  Advanced = 'advanced', // 심화 개념
  Application = 'application', // 응용 개념
}

export enum RelationType {
  Prerequisite = 'prerequisite', // 선수 관계
  Related = 'related', // 연관 관계
  Similar = 'similar', // 유사 관계
}

/**
 * Temperature Emotion (온도 감정)
 * 난이도를 온도로 표현
 */
export interface TemperatureEmotion {
  temperature: number; // 0-1 (0=cold/easy, 1=hot/hard)
  color: string; // HSL color string
  label: string; // "매우 쉬움", "쉬움", "보통", "어려움", "매우 어려움"
}

/**
 * Color Emotion (색감 감정)
 * 카테고리와 상태를 색상으로 표현
 */
export interface ColorEmotion {
  primary: string; // 주요 색상 (카테고리)
  secondary: string; // 보조 색상 (상태)
  gradient: string; // 그라디언트 (완성도)
}

/**
 * Rhythm Emotion (리듬 감정)
 * 진행 상태를 리듬/애니메이션으로 표현
 */
export interface RhythmEmotion {
  tempo: number; // 0-1 (애니메이션 속도)
  pulse: boolean; // 맥박 효과 활성화
  pattern: 'calm' | 'steady' | 'active' | 'intense'; // 리듬 패턴
}

/**
 * LMS Problem Data (문제 정보)
 * LMS에서 받아오는 문제 데이터
 */
export interface LMSProblem {
  id: string;
  title: string;
  description: string;
  concepts: string[]; // 관련 개념들
  difficulty: number; // 0-1
  category: ConceptCategory;
}

/**
 * Student Progress (학습 진행 상황)
 */
export interface StudentProgress {
  nodeId: string;
  completed: boolean;
  score: number; // 0-100
  attempts: number;
  lastAttempt: Date;
}
