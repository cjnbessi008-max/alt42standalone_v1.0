/**
 * Vector Blend LMS - Problem Validator Service
 * Validates student answers against problem criteria
 */

import type { Problem } from '../types/problem';
import type { Vector2D, RGB } from '../types/vector';
import { areColorsEqual, blendVectorColors } from '../engine/color';
import { areVectorsEqual, addVectors } from '../engine/vector';

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  feedback?: string;
  score: number; // 0-100
}

/**
 * Validate student's answer for a problem
 */
export function validateAnswer(
  problem: Problem,
  studentVectors: Vector2D[]
): ValidationResult {
  // Calculate result from student vectors
  const resultVector = studentVectors.length > 0 ? addVectors(...studentVectors) : null;
  const resultColor = blendVectorColors(studentVectors);

  if (!resultVector) {
    return {
      isCorrect: false,
      message: '벡터를 추가해주세요',
      score: 0,
    };
  }

  switch (problem.type) {
    case 'color-matching':
      return validateColorMatching(problem, resultColor);

    case 'target-vector':
      return validateTargetVector(problem, resultVector);

    case 'vector-addition':
      return validateVectorAddition(problem, resultVector, resultColor);

    case 'free-exploration':
      return {
        isCorrect: true,
        message: '자유 탐험 모드입니다',
        score: 100,
      };

    default:
      return {
        isCorrect: false,
        message: '알 수 없는 문제 유형입니다',
        score: 0,
      };
  }
}

/**
 * Validate color matching problem
 */
function validateColorMatching(problem: Problem, resultColor: RGB): ValidationResult {
  if (!problem.targetColor) {
    return {
      isCorrect: false,
      message: '목표 색상이 정의되지 않았습니다',
      score: 0,
    };
  }

  const tolerance = problem.colorTolerance || 30;
  const isCorrect = areColorsEqual(resultColor, problem.targetColor, tolerance);

  if (isCorrect) {
    return {
      isCorrect: true,
      message: problem.successMessage || '정답입니다! 🎉',
      feedback: '목표 색상을 정확하게 만들었습니다!',
      score: 100,
    };
  }

  // Calculate how close they are
  const dr = Math.abs(resultColor.r - problem.targetColor.r);
  const dg = Math.abs(resultColor.g - problem.targetColor.g);
  const db = Math.abs(resultColor.b - problem.targetColor.b);
  const avgDiff = (dr + dg + db) / 3;
  const proximity = Math.max(0, 100 - (avgDiff / 255) * 100);

  return {
    isCorrect: false,
    message: '조금 더 가까워졌어요! 계속 시도해보세요',
    feedback: `목표 색상과 ${Math.round(proximity)}% 일치합니다`,
    score: Math.round(proximity * 0.5), // Partial credit
  };
}

/**
 * Validate target vector problem
 */
function validateTargetVector(problem: Problem, resultVector: Vector2D): ValidationResult {
  if (!problem.targetVector) {
    return {
      isCorrect: false,
      message: '목표 벡터가 정의되지 않았습니다',
      score: 0,
    };
  }

  const tolerance = problem.vectorTolerance || 0.5;
  const isCorrect = areVectorsEqual(resultVector, problem.targetVector, tolerance);

  if (isCorrect) {
    return {
      isCorrect: true,
      message: problem.successMessage || '정답입니다! 🎉',
      feedback: '목표 벡터를 정확하게 만들었습니다!',
      score: 100,
    };
  }

  // Calculate proximity
  const dx = Math.abs(resultVector.x - problem.targetVector.x);
  const dy = Math.abs(resultVector.y - problem.targetVector.y);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = 10; // Maximum expected distance
  const proximity = Math.max(0, 100 - (distance / maxDistance) * 100);

  return {
    isCorrect: false,
    message: '조금 더 가까워졌어요! 계속 시도해보세요',
    feedback: `목표 벡터와 거리: ${distance.toFixed(2)}`,
    score: Math.round(proximity * 0.5), // Partial credit
  };
}

/**
 * Validate vector addition problem (checks both vector and color)
 */
function validateVectorAddition(
  problem: Problem,
  resultVector: Vector2D,
  resultColor: RGB
): ValidationResult {
  let vectorScore = 100;
  let colorScore = 100;
  let messages: string[] = [];

  // Check vector if target exists
  if (problem.targetVector) {
    const tolerance = problem.vectorTolerance || 0.5;
    const isVectorCorrect = areVectorsEqual(resultVector, problem.targetVector, tolerance);
    if (!isVectorCorrect) {
      vectorScore = 50;
      messages.push('벡터의 방향이나 크기를 확인해보세요');
    }
  }

  // Check color if target exists
  if (problem.targetColor) {
    const tolerance = problem.colorTolerance || 30;
    const isColorCorrect = areColorsEqual(resultColor, problem.targetColor, tolerance);
    if (!isColorCorrect) {
      colorScore = 50;
      messages.push('색상 혼합을 확인해보세요');
    }
  }

  const totalScore = (vectorScore + colorScore) / 2;
  const isCorrect = totalScore === 100;

  if (isCorrect) {
    return {
      isCorrect: true,
      message: problem.successMessage || '정답입니다! 🎉',
      feedback: '벡터 합성과 색상 혼합을 모두 정확하게 수행했습니다!',
      score: 100,
    };
  }

  return {
    isCorrect: false,
    message: messages.join('. '),
    feedback: `정확도: ${Math.round(totalScore)}%`,
    score: Math.round(totalScore * 0.7), // Partial credit
  };
}

/**
 * Calculate overall progress for a problem set
 */
export function calculateProgress(
  totalProblems: number,
  completedProblems: number,
  requiredCompletions?: number
): number {
  if (requiredCompletions) {
    return Math.min(100, (completedProblems / requiredCompletions) * 100);
  }
  return (completedProblems / totalProblems) * 100;
}
