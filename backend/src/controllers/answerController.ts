import { Request, Response } from 'express';
import { query } from '../config/database';
import {
  StudentAnswer,
  CorrespondencePair,
  Connection,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Submit student answer and evaluate correctness
 */
export async function submitAnswer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      student_id,
      problem_id,
      connections,
      time_spent_seconds,
      interaction_sequence,
    }: SubmitAnswerRequest = req.body;

    // Validate input
    if (!student_id || !problem_id || !connections) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    // Fetch correct pairs
    const correctPairs = await query<CorrespondencePair[]>(
      `SELECT left_item_id, right_item_id
       FROM correspondence_pairs
       WHERE problem_id = ? AND is_correct_match = TRUE`,
      [problem_id]
    );

    // Check how many previous attempts
    const previousAttempts = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count
       FROM student_answers
       WHERE student_id = ? AND problem_id = ? AND submitted_at IS NOT NULL`,
      [student_id, problem_id]
    );

    const attemptNumber = (previousAttempts[0]?.count || 0) + 1;

    // Get max attempts allowed
    const problems = await query<{ max_attempts: number }[]>(
      'SELECT max_attempts FROM problems WHERE id = ?',
      [problem_id]
    );

    const maxAttempts = problems[0]?.max_attempts || 3;

    // Evaluate answer
    const { isCorrect, score } = evaluateAnswer(connections, correctPairs);

    // Save answer
    const answerId = uuidv4();
    await query(
      `INSERT INTO student_answers
       (id, student_id, problem_id, drawn_connections, is_correct, score,
        time_spent_seconds, attempt_number, interaction_sequence, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        answerId,
        student_id,
        problem_id,
        JSON.stringify(connections),
        isCorrect,
        score,
        time_spent_seconds,
        attemptNumber,
        interaction_sequence ? JSON.stringify(interaction_sequence) : null,
      ]
    );

    // Prepare response
    const response: SubmitAnswerResponse = {
      is_correct: isCorrect,
      score,
      feedback: generateFeedback(isCorrect, score, connections.length),
      attempt_number: attemptNumber,
      can_retry: attemptNumber < maxAttempts && !isCorrect,
    };

    // Include correct answers if all attempts used
    if (attemptNumber >= maxAttempts && !isCorrect) {
      response.correct_answers = correctPairs.map((pair) => ({
        leftId: pair.left_item_id,
        rightId: pair.right_item_id,
      }));
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer',
    });
  }
}

/**
 * Get student's answer history for a problem
 */
export async function getStudentAnswers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { studentId, problemId } = req.params;

    const answers = await query<StudentAnswer[]>(
      `SELECT * FROM student_answers
       WHERE student_id = ? AND problem_id = ?
       ORDER BY submitted_at DESC`,
      [studentId, problemId]
    );

    // Parse JSON fields
    const parsedAnswers = answers.map((answer) => ({
      ...answer,
      drawn_connections:
        typeof answer.drawn_connections === 'string'
          ? JSON.parse(answer.drawn_connections)
          : answer.drawn_connections,
      interaction_sequence:
        typeof answer.interaction_sequence === 'string'
          ? JSON.parse(answer.interaction_sequence)
          : answer.interaction_sequence,
    }));

    res.json({
      success: true,
      data: parsedAnswers,
      count: parsedAnswers.length,
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch answers',
    });
  }
}

/**
 * Evaluate if student's connections match correct pairs
 */
function evaluateAnswer(
  studentConnections: Connection[],
  correctPairs: CorrespondencePair[]
): { isCorrect: boolean; score: number } {
  const totalPairs = correctPairs.length;

  if (studentConnections.length !== totalPairs) {
    return {
      isCorrect: false,
      score: 0,
    };
  }

  let correctCount = 0;

  for (const connection of studentConnections) {
    const isCorrectPair = correctPairs.some(
      (pair) =>
        pair.left_item_id === connection.leftId &&
        pair.right_item_id === connection.rightId
    );

    if (isCorrectPair) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / totalPairs) * 100);
  const isCorrect = correctCount === totalPairs;

  return { isCorrect, score };
}

/**
 * Generate feedback message based on performance
 */
function generateFeedback(
  isCorrect: boolean,
  score: number,
  totalPairs: number
): string {
  if (isCorrect) {
    return '🎉 Perfect! All connections are correct!';
  }

  if (score >= 80) {
    return `Great job! You got ${score}% correct. Review the incorrect connections and try again.`;
  }

  if (score >= 60) {
    return `Good effort! You got ${score}% correct. Keep trying!`;
  }

  if (score >= 40) {
    return `You're making progress. ${score}% correct. Review the material and try again.`;
  }

  return `Keep practicing! You got ${score}% correct. Don't give up!`;
}
