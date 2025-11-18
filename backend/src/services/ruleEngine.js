const { query } = require('../config/database');
const practiceService = require('./practiceService');

/**
 * Rule Engine: Implements adaptive learning rules
 * This is the core "brain" of the practice mode
 */

/**
 * Rule: Determine difficulty level based on student progress
 */
const determineDifficultyLevel = (progress) => {
  if (!progress) return 1; // Start with easiest problems

  const accuracy = progress.accuracy_percentage || 0;
  const masteryLevel = progress.mastery_level;

  // Adaptive difficulty progression
  if (masteryLevel === 'mastery' || accuracy >= 95) {
    return 5; // Maximum difficulty
  } else if (masteryLevel === 'advanced' || accuracy >= 85) {
    return 4;
  } else if (masteryLevel === 'intermediate' || accuracy >= 70) {
    return 3;
  } else if (accuracy >= 50) {
    return 2;
  } else {
    return 1; // Keep it easy if struggling
  }
};

/**
 * Rule: Validate student answer
 */
const validateAnswer = (studentAnswer, correctAnswer, problemType) => {
  if (problemType === 'numeric') {
    // For numeric answers, allow small floating-point differences
    const student = parseFloat(studentAnswer);
    const correct = parseFloat(correctAnswer);
    return Math.abs(student - correct) < 0.01;
  } else if (problemType === 'multiple_choice') {
    return studentAnswer === correctAnswer;
  } else if (problemType === 'text') {
    // Case-insensitive text comparison
    return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  } else {
    // Default: exact match
    return JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer);
  }
};

/**
 * Rule: Generate feedback based on answer correctness and progress
 */
const generateFeedback = (isCorrect, progress, problem) => {
  const accuracy = progress?.accuracy_percentage || 0;
  const totalAttempts = progress?.total_attempts || 0;

  if (isCorrect) {
    // Correct answer feedback
    const encouragements = [
      '정답입니다! 잘하셨어요!',
      '훌륭해요! 계속 이렇게 하세요!',
      '맞았어요! 실력이 늘고 있어요!',
      '대단해요! 정확하게 풀었어요!',
    ];

    let nextAction = 'next_problem';
    if (accuracy >= 75 && accuracy < 95) {
      nextAction = 'suggest_practice_more';
    } else if (accuracy >= 95) {
      nextAction = 'mastery_achieved';
    }

    return {
      message: encouragements[Math.floor(Math.random() * encouragements.length)],
      explanation: problem.problem_template.explanation || '정답입니다.',
      hint: null,
      next_action: nextAction,
    };
  } else {
    // Incorrect answer feedback
    const hints = [
      '다시 한번 생각해보세요. 문제를 천천히 읽어보세요.',
      '아쉬워요! 하지만 괜찮아요. 다시 도전해봐요!',
      '틀렸지만, 실수에서 배울 수 있어요. 다시 시도해보세요!',
    ];

    return {
      message: hints[Math.floor(Math.random() * hints.length)],
      explanation: problem.problem_template.hint || '다시 생각해보세요.',
      hint: totalAttempts > 2 ? problem.problem_template.detailed_hint : null,
      next_action: 'retry',
    };
  }
};

/**
 * Rule: Check mastery status
 * This implements the core mastery criteria
 */
const checkMastery = async (studentId, moduleId) => {
  const progress = await practiceService.getStudentProgress(studentId, moduleId);

  if (!progress) {
    return {
      mastery_status: 'IN_PROGRESS',
      confidence_score: 0,
      recommended_action: 'continue_practice',
    };
  }

  // Get mastery metrics for this module
  const metricsResult = await query(
    'SELECT * FROM mastery_metrics WHERE module_id = $1 LIMIT 1',
    [moduleId]
  );

  const metrics = metricsResult.rows[0] || {
    required_correct_attempts: 5,
    min_accuracy_percentage: 80,
    consecutive_correct: 3,
  };

  // Get recent attempts
  const recentAttempts = await practiceService.getRecentAttempts(studentId, moduleId, 10);
  const consecutiveCorrect = practiceService.getConsecutiveCorrect(recentAttempts);

  // Check mastery criteria
  const hasSufficientAttempts = progress.correct_attempts >= metrics.required_correct_attempts;
  const hasRequiredAccuracy = progress.accuracy_percentage >= metrics.min_accuracy_percentage;
  const hasConsecutiveCorrect = consecutiveCorrect >= metrics.consecutive_correct;

  if (hasSufficientAttempts && hasRequiredAccuracy && hasConsecutiveCorrect) {
    // Update mastery level
    await query(
      'UPDATE student_progress SET mastery_level = $1 WHERE student_id = $2 AND module_id = $3',
      ['mastery', studentId, moduleId]
    );

    return {
      mastery_status: 'MASTERED',
      confidence_score: progress.accuracy_percentage,
      recommended_action: 'next_topic',
    };
  } else if (progress.accuracy_percentage >= metrics.min_accuracy_percentage * 0.9) {
    return {
      mastery_status: 'APPROACHING_MASTERY',
      confidence_score: progress.accuracy_percentage,
      recommended_action: 'practice_more',
    };
  } else {
    return {
      mastery_status: 'IN_PROGRESS',
      confidence_score: progress.accuracy_percentage,
      recommended_action: 'continue_practice',
    };
  }
};

/**
 * Rule: "살짝만 더 해보자" (Practice More) Suggestion
 * Core logic for suggesting additional practice
 */
const practiceMoreSuggestion = (progress) => {
  if (!progress) {
    return {
      should_practice: false,
      message: '아직 연습 기록이 없습니다.',
      suggested_count: 0,
    };
  }

  const accuracy = progress.accuracy_percentage;
  const masteryLevel = progress.mastery_level;

  // Trigger "practice more" when student is approaching mastery
  if (accuracy >= 75 && accuracy < 95 && masteryLevel !== 'mastery') {
    const suggestedCount = Math.ceil((100 - accuracy) / 10); // 1-3 problems

    return {
      should_practice: true,
      message: `거의 다 왔어요! 조금만 더 연습하면 완벽하게 마스터할 수 있어요! 현재 정확도: ${accuracy.toFixed(1)}%`,
      suggested_count: Math.min(suggestedCount, 5),
      current_accuracy: accuracy,
      target_accuracy: 95,
    };
  } else if (accuracy >= 95) {
    return {
      should_practice: false,
      message: '축하합니다! 이미 마스터하셨어요!',
      suggested_count: 0,
      mastery_achieved: true,
    };
  } else {
    return {
      should_practice: false,
      message: '계속 연습하세요. 조금만 더 하면 제안을 드릴게요!',
      suggested_count: 0,
      current_accuracy: accuracy,
    };
  }
};

/**
 * Rule: Generate contextual hint
 */
const generateHint = (problem, currentAnswer) => {
  const hints = problem.problem_template.hints || [];

  if (hints.length === 0) {
    return {
      text: '문제를 천천히 다시 읽어보세요.',
      level: 0,
    };
  }

  // Return hints progressively
  const hintLevel = Math.min(hints.length - 1, 2);

  return {
    text: hints[hintLevel],
    level: hintLevel,
  };
};

module.exports = {
  determineDifficultyLevel,
  validateAnswer,
  generateFeedback,
  checkMastery,
  practiceMoreSuggestion,
  generateHint,
};
