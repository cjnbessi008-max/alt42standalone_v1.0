/**
 * Emotion Mapper Utility
 * 그래프 데이터를 감정 표현(온도, 색감, 리듬)으로 변환
 */

import chroma from 'chroma-js';
import {
  GraphNode,
  TemperatureEmotion,
  ColorEmotion,
  RhythmEmotion,
  ConceptCategory,
} from '../types/graph.types';

/**
 * 난이도를 온도 감정으로 변환
 * 0 (쉬움) = 차가운 파란색
 * 1 (어려움) = 뜨거운 빨간색
 */
export function mapDifficultyToTemperature(difficulty: number): TemperatureEmotion {
  // HSL 색상: 240 (파란색) -> 0 (빨간색)
  const hue = 240 - difficulty * 240;
  const saturation = 60 + difficulty * 30; // 60-90%
  const lightness = 50 + (1 - difficulty) * 10; // 60-50%

  const color = chroma.hsl(hue, saturation / 100, lightness / 100).hex();

  let label = '';
  if (difficulty < 0.2) label = '매우 쉬움';
  else if (difficulty < 0.4) label = '쉬움';
  else if (difficulty < 0.6) label = '보통';
  else if (difficulty < 0.8) label = '어려움';
  else label = '매우 어려움';

  return {
    temperature: difficulty,
    color,
    label,
  };
}

/**
 * 카테고리와 완성도를 색감 감정으로 변환
 */
export function mapNodeToColorEmotion(node: GraphNode): ColorEmotion {
  // 카테고리별 주요 색상
  const categoryColors: Record<ConceptCategory, string> = {
    [ConceptCategory.Foundation]: '#3B82F6', // 파란색 (기초)
    [ConceptCategory.Core]: '#10B981', // 초록색 (핵심)
    [ConceptCategory.Advanced]: '#F59E0B', // 주황색 (심화)
    [ConceptCategory.Application]: '#8B5CF6', // 보라색 (응용)
  };

  const primary = categoryColors[node.category];

  // 완성도에 따른 보조 색상
  const secondary = node.completed
    ? '#22C55E' // 초록색 (완료)
    : node.progress > 0
    ? '#FBBF24' // 노란색 (진행 중)
    : '#9CA3AF'; // 회색 (미시작)

  // 완성도 그라디언트 (회색 -> 주요 색상)
  const gradientStart = chroma('#E5E7EB').hex();
  const gradientEnd = chroma(primary).hex();
  const gradient = `linear-gradient(135deg, ${gradientStart} ${
    100 - node.progress
  }%, ${gradientEnd} ${node.progress}%)`;

  return {
    primary,
    secondary,
    gradient,
  };
}

/**
 * 진행 상태를 리듬 감정으로 변환
 */
export function mapProgressToRhythm(
  progress: number,
  completed: boolean
): RhythmEmotion {
  let pattern: 'calm' | 'steady' | 'active' | 'intense';
  let tempo: number;
  let pulse: boolean;

  if (completed) {
    // 완료됨: 차분함
    pattern = 'calm';
    tempo = 0.2;
    pulse = false;
  } else if (progress > 50) {
    // 진행 중 (50% 이상): 활발함
    pattern = 'active';
    tempo = 0.8;
    pulse = true;
  } else if (progress > 0) {
    // 진행 중 (50% 미만): 안정적
    pattern = 'steady';
    tempo = 0.5;
    pulse = true;
  } else {
    // 미시작: 차분함
    pattern = 'calm';
    tempo = 0.3;
    pulse = false;
  }

  return {
    tempo,
    pulse,
    pattern,
  };
}

/**
 * 온도 색상 스케일 생성
 * D3 또는 시각화에서 사용
 */
export function createTemperatureScale(): chroma.Scale {
  return chroma
    .scale([
      '#60A5FA', // 파란색 (차가움, 쉬움)
      '#34D399', // 청록색
      '#FBBF24', // 노란색
      '#FB923C', // 주황색
      '#EF4444', // 빨간색 (뜨거움, 어려움)
    ])
    .mode('lch')
    .domain([0, 1]);
}

/**
 * 노드 크기 계산
 * 중요도나 완성도에 따라 크기 조정
 */
export function calculateNodeSize(node: GraphNode): number {
  const baseSize = 30;
  const progressBonus = node.progress * 0.3; // 최대 30% 증가
  const difficultyBonus = node.difficulty * 0.2; // 최대 20% 증가
  return baseSize * (1 + progressBonus + difficultyBonus);
}

/**
 * 엣지 두께 계산
 * 관계 강도에 따라 두께 조정
 */
export function calculateEdgeThickness(strength: number): number {
  const minThickness = 1;
  const maxThickness = 5;
  return minThickness + strength * (maxThickness - minThickness);
}

/**
 * 애니메이션 지속 시간 계산
 * 템포에 따라 계산
 */
export function calculateAnimationDuration(tempo: number): number {
  // 템포가 높을수록 빠른 애니메이션
  const minDuration = 0.5; // 초
  const maxDuration = 3; // 초
  return maxDuration - tempo * (maxDuration - minDuration);
}
