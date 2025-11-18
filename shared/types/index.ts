/**
 * Shared type definitions for Similarity Warm application
 */

// Moodle 문제 타입
export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  questiontype: string;
  category: string;
}

// 도형 타입
export interface Shape {
  id: string;
  type: 'triangle' | 'rectangle' | 'polygon';
  vertices: Point[];
  sides: number[];
  angles: number[];
}

// 좌표 타입
export interface Point {
  x: number;
  y: number;
}

// 닮음 조건 타입
export enum SimilarityCondition {
  SSS = 'SSS', // Side-Side-Side
  SAS = 'SAS', // Side-Angle-Side
  AA = 'AA',   // Angle-Angle
}

// 닮음 검증 결과
export interface SimilarityResult {
  isSimilar: boolean;
  condition?: SimilarityCondition;
  ratio?: number;
  message: string;
  details?: {
    sides?: number[];
    angles?: number[];
    matchedSides?: [number, number][];
    matchedAngles?: [number, number][];
  };
}

// 문제 데이터
export interface ProblemData {
  id: string;
  title: string;
  description: string;
  shape1: Shape;
  shape2: Shape;
  correctAnswer: SimilarityResult;
}

// 사용자 답안
export interface UserAnswer {
  problemId: string;
  selectedCondition: SimilarityCondition | null;
  calculatedRatio?: number;
  timestamp: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
