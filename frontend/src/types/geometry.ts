/**
 * Unfolding Net Live - Type Definitions
 * 3D 전개도 시스템을 위한 타입 정의
 */

import * as THREE from 'three';

/**
 * 지원하는 도형 타입
 */
export enum PolyhedronType {
  CUBE = 'cube',
  TETRAHEDRON = 'tetrahedron',
  OCTAHEDRON = 'octahedron',
  PYRAMID = 'pyramid',
  PRISM = 'prism',
}

/**
 * 애니메이션 상태
 */
export enum AnimationState {
  IDLE = 'idle',
  FOLDING = 'folding',
  UNFOLDING = 'unfolding',
  PAUSED = 'paused',
}

/**
 * 면(Face) 정보
 */
export interface Face {
  id: string;
  vertices: THREE.Vector3[];
  normal: THREE.Vector3;
  color: string;
  index: number;
}

/**
 * 전개도 문제 정보 (Moodle에서 받아오는 데이터)
 */
export interface UnfoldingProblem {
  id: string;
  type: PolyhedronType;
  difficulty: number; // 1-5
  title: string;
  description: string;
  targetRotation?: THREE.Euler;
  initialViewAngle?: {
    azimuth: number;
    polar: number;
  };
}

/**
 * 애니메이션 설정
 */
export interface AnimationConfig {
  speed: number; // 0.1 - 2.0
  autoReverse: boolean;
  pauseOnComplete: boolean;
  duration: number; // milliseconds
}

/**
 * 사용자 인터랙션 이벤트
 */
export interface InteractionEvent {
  type: 'click' | 'drag' | 'zoom' | 'rotate';
  timestamp: number;
  faceId?: string;
  position?: THREE.Vector3;
  delta?: THREE.Vector2;
}

/**
 * 전개도 상태 저장
 */
export interface GeometryState {
  currentProblem: UnfoldingProblem | null;
  animationState: AnimationState;
  animationProgress: number; // 0 - 1
  animationConfig: AnimationConfig;
  selectedFaceId: string | null;
  interactionHistory: InteractionEvent[];
}

/**
 * Moodle API 응답 타입
 */
export interface MoodleResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * 문제 데이터 요청 파라미터
 */
export interface ProblemRequestParams {
  courseId: string;
  moduleId: string;
  userId?: string;
}
