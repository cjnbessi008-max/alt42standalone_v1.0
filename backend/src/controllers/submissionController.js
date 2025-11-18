import { Submission, Problem, Progress } from '../models/index.js';
import { logger } from '../config/logger.js';
import { evaluateAnswer } from '../services/quantifierService.js';
import { updateStudentProgress } from '../services/progressService.js';

// Submit an answer
export const submitAnswer = async (req, res) => {
  try {
    const {
      problemId,
      studentId,
      studentAnswer,
      timeSpent,
      hintsUsed = 0
    } = req.body;

    // Get the problem
    const problem = await Problem.findByPk(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Evaluate the answer
    const { isCorrect, score, feedback } = evaluateAnswer(
      problem,
      studentAnswer
    );

    // Check if this is a retry (count attempts)
    const previousAttempts = await Submission.count({
      where: { problemId, studentId }
    });

    // Create submission
    const submission = await Submission.create({
      problemId,
      studentId,
      studentAnswer,
      isCorrect,
      score,
      timeSpent,
      hintsUsed,
      attempts: previousAttempts + 1,
      feedback
    });

    // Update student progress
    await updateStudentProgress(studentId, {
      problemId,
      isCorrect,
      score,
      timeSpent,
      quantifierType: problem.quantifierType
    });

    logger.info(`Submission created: ${submission.id} - Student: ${studentId}, Correct: ${isCorrect}`);

    res.status(201).json({
      submission,
      feedback,
      explanation: isCorrect ? problem.explanation : null
    });
  } catch (error) {
    logger.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Get a specific submission
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findByPk(id, {
      include: [{ model: Problem, as: 'problem' }]
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    logger.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// Get all submissions by a student
export const getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Submission.findAndCountAll({
      where: { studentId },
      include: [{ model: Problem, as: 'problem' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      submissions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching student submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Get all submissions for a problem
export const getSubmissionsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Submission.findAndCountAll({
      where: { problemId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      submissions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching problem submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};
