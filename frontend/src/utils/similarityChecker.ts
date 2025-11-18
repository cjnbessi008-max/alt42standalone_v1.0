/**
 * 닮음 조건 검증 유틸리티
 * 두 도형이 닮음 관계인지 확인하고 어떤 조건으로 닮음인지 판정
 */

import { Shape, SimilarityResult, SimilarityCondition } from '@types/index';

const ANGLE_TOLERANCE = 1; // 각도 오차 허용 범위 (도)
const RATIO_TOLERANCE = 0.01; // 비율 오차 허용 범위

/**
 * 두 값이 오차 범위 내에서 같은지 확인
 */
function approximatelyEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * 배열의 모든 값이 같은지 확인 (오차 허용)
 */
function allApproximatelyEqual(values: number[], tolerance: number): boolean {
  if (values.length === 0) return true;
  const first = values[0];
  return values.every(v => approximatelyEqual(v, first, tolerance));
}

/**
 * SSS (변-변-변) 닮음 조건 확인
 * 대응하는 세 변의 길이의 비가 같으면 닮음
 */
function checkSSS(shape1: Shape, shape2: Shape): SimilarityResult | null {
  if (shape1.sides.length !== 3 || shape2.sides.length !== 3) {
    return null; // 삼각형이 아니면 SSS 적용 불가
  }

  // 변의 길이를 정렬하여 대응 관계 확인
  const sides1 = [...shape1.sides].sort((a, b) => a - b);
  const sides2 = [...shape2.sides].sort((a, b) => a - b);

  // 각 대응변의 비율 계산
  const ratios = sides1.map((s1, i) => sides2[i] / s1);

  // 모든 비율이 같은지 확인
  if (allApproximatelyEqual(ratios, RATIO_TOLERANCE)) {
    const ratio = ratios[0];
    return {
      isSimilar: true,
      condition: SimilarityCondition.SSS,
      ratio,
      message: `SSS 닮음 조건 성립! 대응변의 비가 1:${ratio.toFixed(2)}로 같습니다.`,
      details: {
        sides: ratios,
        matchedSides: sides1.map((s1, i) => [s1, sides2[i]]),
      },
    };
  }

  return null;
}

/**
 * SAS (변-각-변) 닮음 조건 확인
 * 두 변의 비가 같고 그 끼인각이 같으면 닮음
 */
function checkSAS(shape1: Shape, shape2: Shape): SimilarityResult | null {
  if (shape1.sides.length !== 3 || shape2.sides.length !== 3) {
    return null; // 삼각형이 아니면 SAS 적용 불가
  }

  const sides1 = shape1.sides;
  const sides2 = shape2.sides;
  const angles1 = shape1.angles;
  const angles2 = shape2.angles;

  // 각 꼭짓점에 대해 확인
  for (let i = 0; i < 3; i++) {
    const side1_a = sides1[i];
    const side1_b = sides1[(i + 1) % 3];
    const angle1 = angles1[(i + 1) % 3]; // 끼인각

    for (let j = 0; j < 3; j++) {
      const side2_a = sides2[j];
      const side2_b = sides2[(j + 1) % 3];
      const angle2 = angles2[(j + 1) % 3]; // 끼인각

      // 끼인각이 같은지 확인
      if (approximatelyEqual(angle1, angle2, ANGLE_TOLERANCE)) {
        // 두 변의 비율 계산
        const ratio1 = side2_a / side1_a;
        const ratio2 = side2_b / side1_b;

        // 두 변의 비가 같은지 확인
        if (approximatelyEqual(ratio1, ratio2, RATIO_TOLERANCE)) {
          return {
            isSimilar: true,
            condition: SimilarityCondition.SAS,
            ratio: ratio1,
            message: `SAS 닮음 조건 성립! 두 변의 비가 1:${ratio1.toFixed(2)}로 같고, 끼인각이 ${angle1.toFixed(1)}°로 같습니다.`,
            details: {
              matchedSides: [[side1_a, side2_a], [side1_b, side2_b]],
              matchedAngles: [[angle1, angle2]],
            },
          };
        }
      }
    }
  }

  return null;
}

/**
 * AA (각-각) 닮음 조건 확인
 * 두 각이 각각 같으면 닮음 (삼각형의 경우)
 */
function checkAA(shape1: Shape, shape2: Shape): SimilarityResult | null {
  if (shape1.angles.length !== 3 || shape2.angles.length !== 3) {
    return null; // 삼각형이 아니면 AA 적용 불가
  }

  const angles1 = [...shape1.angles].sort((a, b) => a - b);
  const angles2 = [...shape2.angles].sort((a, b) => a - b);

  // 적어도 두 각이 일치하는지 확인
  let matchCount = 0;
  const matchedAngles: [number, number][] = [];

  for (let i = 0; i < 3; i++) {
    if (approximatelyEqual(angles1[i], angles2[i], ANGLE_TOLERANCE)) {
      matchCount++;
      matchedAngles.push([angles1[i], angles2[i]]);
    }
  }

  if (matchCount >= 2) {
    // 대응변의 비율 계산
    const sides1 = [...shape1.sides].sort((a, b) => a - b);
    const sides2 = [...shape2.sides].sort((a, b) => a - b);
    const ratio = sides2[0] / sides1[0];

    return {
      isSimilar: true,
      condition: SimilarityCondition.AA,
      ratio,
      message: `AA 닮음 조건 성립! 두 각이 각각 ${matchedAngles[0][0].toFixed(1)}°, ${matchedAngles[1][0].toFixed(1)}°로 같습니다.`,
      details: {
        matchedAngles,
        angles: [matchedAngles[0][0], matchedAngles[1][0]],
      },
    };
  }

  return null;
}

/**
 * 두 도형의 닮음 여부 확인
 * SSS, SAS, AA 조건을 순서대로 확인
 */
export function checkSimilarity(shape1: Shape, shape2: Shape): SimilarityResult {
  // SSS 조건 확인
  const sssResult = checkSSS(shape1, shape2);
  if (sssResult) return sssResult;

  // SAS 조건 확인
  const sasResult = checkSAS(shape1, shape2);
  if (sasResult) return sasResult;

  // AA 조건 확인
  const aaResult = checkAA(shape1, shape2);
  if (aaResult) return aaResult;

  // 닮음이 아님
  return {
    isSimilar: false,
    message: '닮음 조건이 성립하지 않습니다.',
  };
}

/**
 * 두 점 사이의 거리 계산
 */
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * 세 점으로 이루어진 각도 계산 (라디안 -> 도)
 */
export function calculateAngle(
  p1: { x: number; y: number },
  vertex: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
  const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
  let angle = Math.abs(angle2 - angle1);

  // 0-180도 범위로 정규화
  if (angle > Math.PI) {
    angle = 2 * Math.PI - angle;
  }

  return (angle * 180) / Math.PI;
}

/**
 * 도형의 변 길이 배열 계산
 */
export function calculateSides(vertices: { x: number; y: number }[]): number[] {
  const sides: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    sides.push(distance(p1, p2));
  }
  return sides;
}

/**
 * 도형의 내각 배열 계산
 */
export function calculateAngles(vertices: { x: number; y: number }[]): number[] {
  const angles: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[(i - 1 + vertices.length) % vertices.length];
    const vertex = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    angles.push(calculateAngle(p1, vertex, p2));
  }
  return angles;
}
