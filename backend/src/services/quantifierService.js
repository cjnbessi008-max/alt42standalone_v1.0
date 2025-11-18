/**
 * Quantifier Service
 * Handles logic for evaluating universal (모든) and existential (어떤) quantifiers
 */

import { logger } from '../config/logger.js';

/**
 * Evaluate student's answer against the correct answer
 * @param {Object} problem - The problem object
 * @param {any} studentAnswer - The student's submitted answer
 * @returns {Object} - { isCorrect, score, feedback }
 */
export const evaluateAnswer = (problem, studentAnswer) => {
  try {
    const { quantifierType, correctAnswer, statement } = problem;

    let isCorrect = false;
    let score = 0;
    let feedback = '';

    if (quantifierType === 'universal') {
      // Universal quantifier (모든): ALL elements must satisfy the condition
      const result = evaluateUniversalQuantifier(problem, studentAnswer);
      isCorrect = result.isCorrect;
      score = result.score;
      feedback = result.feedback;
    } else if (quantifierType === 'existential') {
      // Existential quantifier (어떤): AT LEAST ONE element must satisfy the condition
      const result = evaluateExistentialQuantifier(problem, studentAnswer);
      isCorrect = result.isCorrect;
      score = result.score;
      feedback = result.feedback;
    }

    return { isCorrect, score, feedback };
  } catch (error) {
    logger.error('Error evaluating answer:', error);
    return {
      isCorrect: false,
      score: 0,
      feedback: 'An error occurred while evaluating your answer.'
    };
  }
};

/**
 * Evaluate universal quantifier (모든)
 * Example: "모든 숫자가 짝수이다" - ALL numbers must be even
 */
const evaluateUniversalQuantifier = (problem, studentAnswer) => {
  const { correctAnswer, options } = problem;

  // Handle boolean answer (True/False)
  if (typeof correctAnswer === 'boolean') {
    const isCorrect = studentAnswer === correctAnswer;
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect
        ? '정답입니다! 모든 요소가 조건을 만족합니다.'
        : '틀렸습니다. "모든"은 모든 요소가 조건을 만족해야 합니다.'
    };
  }

  // Handle multiple selection (student selects which elements satisfy)
  if (Array.isArray(studentAnswer)) {
    const correctSet = new Set(correctAnswer);
    const studentSet = new Set(studentAnswer);

    // Check if sets are equal
    const isCorrect =
      correctSet.size === studentSet.size &&
      [...correctSet].every(item => studentSet.has(item));

    const partialScore = calculateSetSimilarity(correctSet, studentSet);

    return {
      isCorrect,
      score: isCorrect ? 100 : partialScore,
      feedback: isCorrect
        ? '정답입니다! 조건을 만족하는 모든 요소를 올바르게 선택했습니다.'
        : `부분 정답입니다 (${partialScore.toFixed(0)}점). 일부 요소를 놓쳤거나 잘못 선택했습니다.`
    };
  }

  return {
    isCorrect: false,
    score: 0,
    feedback: '답변 형식이 올바르지 않습니다.'
  };
};

/**
 * Evaluate existential quantifier (어떤)
 * Example: "어떤 숫자가 소수이다" - AT LEAST ONE number must be prime
 */
const evaluateExistentialQuantifier = (problem, studentAnswer) => {
  const { correctAnswer, options } = problem;

  // Handle boolean answer (True/False)
  if (typeof correctAnswer === 'boolean') {
    const isCorrect = studentAnswer === correctAnswer;
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect
        ? '정답입니다! 적어도 하나의 요소가 조건을 만족합니다.'
        : '틀렸습니다. "어떤"은 최소 하나의 요소가 조건을 만족해야 합니다.'
    };
  }

  // Handle single selection or multiple selection
  if (Array.isArray(studentAnswer) || typeof studentAnswer === 'string' || typeof studentAnswer === 'number') {
    const studentSelections = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
    const correctSelections = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    // For existential, student needs to identify AT LEAST ONE correct element
    const hasCorrectElement = studentSelections.some(item =>
      correctSelections.includes(item)
    );

    // Check if student selected any incorrect elements
    const hasIncorrectElement = studentSelections.some(item =>
      !correctSelections.includes(item)
    );

    let isCorrect = false;
    let score = 0;
    let feedback = '';

    if (hasCorrectElement && !hasIncorrectElement) {
      isCorrect = true;
      score = 100;
      feedback = '정답입니다! 조건을 만족하는 요소를 올바르게 찾았습니다.';
    } else if (hasCorrectElement && hasIncorrectElement) {
      score = 50;
      feedback = '부분 정답입니다. 올바른 요소도 있지만, 조건을 만족하지 않는 요소도 선택했습니다.';
    } else {
      score = 0;
      feedback = '틀렸습니다. 선택한 요소가 조건을 만족하지 않습니다.';
    }

    return { isCorrect, score, feedback };
  }

  return {
    isCorrect: false,
    score: 0,
    feedback: '답변 형식이 올바르지 않습니다.'
  };
};

/**
 * Calculate similarity between two sets (for partial credit)
 */
const calculateSetSimilarity = (set1, set2) => {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return (intersection.size / union.size) * 100;
};

/**
 * Generate feedback based on quantifier type and student performance
 */
export const generateDetailedFeedback = (problem, studentAnswer, isCorrect) => {
  const { quantifierType, statement } = problem;

  if (isCorrect) {
    return {
      message: '정답입니다!',
      explanation: problem.explanation || '',
      encouragement: '잘했어요! 논리적 한정사를 정확히 이해하고 있습니다.'
    };
  }

  let hint = '';
  if (quantifierType === 'universal') {
    hint = '"모든"은 예외 없이 모든 요소가 조건을 만족해야 합니다. 단 하나라도 조건을 만족하지 않으면 거짓입니다.';
  } else if (quantifierType === 'existential') {
    hint = '"어떤"은 최소한 하나의 요소가 조건을 만족하면 참입니다. 반례가 있어도 하나만 만족하면 됩니다.';
  }

  return {
    message: '틀렸습니다.',
    hint,
    encouragement: '다시 한 번 생각해보세요!'
  };
};

export default {
  evaluateAnswer,
  generateDetailedFeedback
};
