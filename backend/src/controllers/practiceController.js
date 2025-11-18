const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const practiceService = require('../services/practiceService');
const ruleEngine = require('../services/ruleEngine');

/**
 * Get next problem for student based on current progress
 */
const getNextProblem = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    // Get student's current progress
    const progress = await practiceService.getStudentProgress(studentId, moduleId);

    // Determine difficulty level based on progress
    const difficultyLevel = ruleEngine.determineDifficultyLevel(progress);

    // Get a problem from the problem bank
    const problem = await practiceService.selectProblem(moduleId, difficultyLevel);

    if (!problem) {
      throw new AppError('No problems available for this module', 404, 'NO_PROBLEMS');
    }

    res.json({
      success: true,
      data: {
        problem: {
          id: problem.id,
          statement: problem.problem_template.statement,
          type: problem.problem_template.type,
          difficulty_level: problem.difficulty_level,
          estimated_time: problem.metadata?.estimated_time || 60,
        },
        studentProgress: {
          mastery_level: progress?.mastery_level || 'beginner',
          accuracy_percentage: progress?.accuracy_percentage || 0,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific problem by ID
 */
const getProblemById = async (req, res, next) => {
  try {
    const { moduleId, problemId } = req.params;
    const studentId = req.user.id;

    const result = await query(
      'SELECT * FROM problem_bank WHERE id = $1 AND module_id = $2 AND is_active = true',
      [problemId, moduleId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Problem not found', 404, 'PROBLEM_NOT_FOUND');
    }

    const problem = result.rows[0];

    res.json({
      success: true,
      data: {
        problem: {
          id: problem.id,
          statement: problem.problem_template.statement,
          type: problem.problem_template.type,
          difficulty_level: problem.difficulty_level,
          visuals: problem.problem_template.visuals,
          interactive_elements: problem.problem_template.interactive_elements,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit answer and get feedback
 */
const submitAnswer = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;
    const { problemId, answer, timeSpent, hintsUsed } = req.body;

    // Validate input
    if (!problemId || answer === undefined) {
      throw new AppError('Problem ID and answer are required', 400, 'INVALID_INPUT');
    }

    // Get problem details
    const problemResult = await query(
      'SELECT * FROM problem_bank WHERE id = $1 AND module_id = $2',
      [problemId, moduleId]
    );

    if (problemResult.rows.length === 0) {
      throw new AppError('Problem not found', 404, 'PROBLEM_NOT_FOUND');
    }

    const problem = problemResult.rows[0];

    // Validate answer
    const isCorrect = ruleEngine.validateAnswer(
      answer,
      problem.problem_template.correct_answer,
      problem.problem_template.type
    );

    // Record attempt
    await query(
      `INSERT INTO problem_attempt
       (student_id, module_id, problem_id, submitted_answer, is_correct, time_spent_seconds, hints_used, difficulty_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [studentId, moduleId, problemId, JSON.stringify(answer), isCorrect, timeSpent || 0, hintsUsed || 0, problem.difficulty_level]
    );

    // Get updated progress
    const progress = await practiceService.getStudentProgress(studentId, moduleId);

    // Generate feedback
    const feedback = ruleEngine.generateFeedback(isCorrect, progress, problem);

    // Check mastery status
    const masteryCheck = await ruleEngine.checkMastery(studentId, moduleId);

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`student:${studentId}`).emit('progress:updated', {
      progress,
      masteryAchieved: masteryCheck.mastery_status === 'MASTERED',
    });

    res.json({
      success: true,
      data: {
        is_correct: isCorrect,
        feedback: feedback.message,
        explanation: feedback.explanation,
        hint: feedback.hint,
        next_action: feedback.next_action,
        progress: {
          accuracy_percentage: progress.accuracy_percentage,
          mastery_level: progress.mastery_level,
          total_attempts: progress.total_attempts,
        },
        mastery_status: masteryCheck.mastery_status,
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get practice suggestion ("살짝만 더 해보자" logic)
 */
const getPracticeSuggestion = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    const progress = await practiceService.getStudentProgress(studentId, moduleId);

    if (!progress) {
      return res.json({
        success: true,
        data: {
          should_practice: false,
          message: '아직 연습 기록이 없습니다. 먼저 문제를 풀어보세요!',
          suggested_count: 0,
        },
      });
    }

    // Apply "practice more" rule
    const suggestion = ruleEngine.practiceMoreSuggestion(progress);

    res.json({
      success: true,
      data: suggestion,
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start "practice more" session
 */
const startPracticeMore = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;

    // Log analytics event
    await query(
      `INSERT INTO practice_analytics (student_id, module_id, event_type, event_data)
       VALUES ($1, $2, 'practice_more_clicked', '{}')`,
      [studentId, moduleId]
    ).catch(() => {
      // Analytics table might not exist yet - ignore error
    });

    // Get first problem
    const progress = await practiceService.getStudentProgress(studentId, moduleId);
    const difficultyLevel = ruleEngine.determineDifficultyLevel(progress);
    const problem = await practiceService.selectProblem(moduleId, difficultyLevel);

    if (!problem) {
      throw new AppError('No problems available', 404, 'NO_PROBLEMS');
    }

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`student:${studentId}`).emit('practice:started', {
      moduleId,
      problemCount: ruleEngine.practiceMoreSuggestion(progress).suggested_count,
    });

    res.json({
      success: true,
      data: {
        message: '좋아요! 조금만 더 연습하면 마스터할 수 있어요!',
        problem: {
          id: problem.id,
          statement: problem.problem_template.statement,
          type: problem.problem_template.type,
          difficulty_level: problem.difficulty_level,
        },
        suggested_count: ruleEngine.practiceMoreSuggestion(progress).suggested_count,
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request hint for current problem
 */
const requestHint = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user.id;
    const { problemId, currentAnswer } = req.body;

    if (!problemId) {
      throw new AppError('Problem ID is required', 400, 'INVALID_INPUT');
    }

    // Get problem details
    const problemResult = await query(
      'SELECT * FROM problem_bank WHERE id = $1 AND module_id = $2',
      [problemId, moduleId]
    );

    if (problemResult.rows.length === 0) {
      throw new AppError('Problem not found', 404, 'PROBLEM_NOT_FOUND');
    }

    const problem = problemResult.rows[0];

    // Generate contextual hint
    const hint = ruleEngine.generateHint(problem, currentAnswer);

    res.json({
      success: true,
      data: {
        hint: hint.text,
        hint_level: hint.level,
        remaining_hints: Math.max(0, 3 - (hint.level + 1)),
      },
      meta: {
        timestamp: new Date().toISOString(),
        studentId,
        moduleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNextProblem,
  getProblemById,
  submitAnswer,
  getPracticeSuggestion,
  startPracticeMore,
  requestHint,
};
