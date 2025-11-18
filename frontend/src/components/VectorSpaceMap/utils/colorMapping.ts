/**
 * 개념 색상 매핑 유틸리티
 */

export type ColorScheme = 'by-category' | 'by-difficulty' | 'by-mastery';

// 카테고리별 색상 팔레트
const CATEGORY_COLORS: Record<string, string> = {
  'fraction': '#FF6B6B',      // 빨강
  'operation': '#4ECDC4',     // 청록
  'geometry': '#45B7D1',      // 파랑
  'algebra': '#96CEB4',       // 초록
  'statistics': '#FFEAA7',    // 노랑
  'probability': '#DFE6E9',   // 회색
  'logic': '#A29BFE',         // 보라
  'measurement': '#FD79A8',   // 분홍
  'default': '#95A5A6',       // 기본 회색
};

// 난이도별 색상 그라데이션 (1-5)
const DIFFICULTY_COLORS = [
  '#2ECC71',  // 1: 초록 (쉬움)
  '#F1C40F',  // 2: 노랑
  '#E67E22',  // 3: 주황
  '#E74C3C',  // 4: 빨강
  '#8E44AD',  // 5: 보라 (어려움)
];

// 숙달도별 색상 그라데이션 (0-1)
const MASTERY_COLORS = {
  low: '#E74C3C',     // 빨강 (0-0.3)
  medium: '#F39C12',  // 주황 (0.3-0.7)
  high: '#27AE60',    // 초록 (0.7-1.0)
};

/**
 * 카테고리에 따른 색상 반환
 */
export function getColorByCategory(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

/**
 * 난이도에 따른 색상 반환
 */
export function getColorByDifficulty(difficulty: number): string {
  const index = Math.min(Math.max(Math.floor(difficulty) - 1, 0), 4);
  return DIFFICULTY_COLORS[index];
}

/**
 * 숙달도에 따른 색상 반환
 */
export function getColorByMastery(mastery: number): string {
  if (mastery < 0.3) return MASTERY_COLORS.low;
  if (mastery < 0.7) return MASTERY_COLORS.medium;
  return MASTERY_COLORS.high;
}

/**
 * 색상 스키마에 따라 적절한 색상 반환
 */
export function getConceptColor(
  scheme: ColorScheme,
  category: string,
  difficulty: number,
  mastery?: number
): string {
  switch (scheme) {
    case 'by-category':
      return getColorByCategory(category);
    case 'by-difficulty':
      return getColorByDifficulty(difficulty);
    case 'by-mastery':
      return mastery !== undefined ? getColorByMastery(mastery) : '#95A5A6';
    default:
      return '#95A5A6';
  }
}

/**
 * 색상을 투명도와 함께 반환
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // HEX to RGBA 변환
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 범례 생성을 위한 색상 정보 반환
 */
export function getLegendItems(scheme: ColorScheme): Array<{ label: string; color: string }> {
  switch (scheme) {
    case 'by-category':
      return Object.entries(CATEGORY_COLORS)
        .filter(([key]) => key !== 'default')
        .map(([key, color]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color,
        }));

    case 'by-difficulty':
      return DIFFICULTY_COLORS.map((color, index) => ({
        label: `Level ${index + 1}`,
        color,
      }));

    case 'by-mastery':
      return [
        { label: 'Low (0-30%)', color: MASTERY_COLORS.low },
        { label: 'Medium (30-70%)', color: MASTERY_COLORS.medium },
        { label: 'High (70-100%)', color: MASTERY_COLORS.high },
      ];

    default:
      return [];
  }
}
