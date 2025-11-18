import { db } from '../config/database';
import { Submission, CheckpointValidation, Problem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

export class SubmissionModel {
  /**
   * Create a new submission
   */
  static create(
    studentId: string,
    problemId: string,
    answer: any,
    timeSpent?: number
  ): Submission {
    try {
      const id = uuidv4();

      // Get current attempt number for this student and problem
      const prevSubmissions = db.prepare(
        'SELECT COUNT(*) as count FROM submissions WHERE student_id = ? AND problem_id = ?'
      ).get(studentId, problemId) as { count: number };

      const attemptNumber = prevSubmissions.count + 1;

      const stmt = db.prepare(`
        INSERT INTO submissions (id, student_id, problem_id, answer, attempt_number, time_spent_seconds, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `);

      stmt.run(
        id,
        studentId,
        problemId,
        JSON.stringify(answer),
        attemptNumber,
        timeSpent || null
      );

      logger.info('Submission created', { id, studentId, problemId, attemptNumber });

      return this.findById(id)!;
    } catch (error) {
      logger.error('Failed to create submission:', error);
      throw error;
    }
  }

  /**
   * Find submission by ID
   */
  static findById(id: string): Submission | null {
    try {
      const submission = db.prepare(
        'SELECT * FROM submissions WHERE id = ?'
      ).get(id) as Submission | undefined;

      return submission || null;
    } catch (error) {
      logger.error('Failed to find submission:', error);
      throw error;
    }
  }

  /**
   * Update submission status
   */
  static updateStatus(id: string, status: Submission['status']): void {
    try {
      db.prepare(
        'UPDATE submissions SET status = ? WHERE id = ?'
      ).run(status, id);

      logger.info('Submission status updated', { id, status });
    } catch (error) {
      logger.error('Failed to update submission status:', error);
      throw error;
    }
  }

  /**
   * Update submission with score and feedback
   */
  static updateScoreAndFeedback(
    id: string,
    score: number,
    feedback: any
  ): void {
    try {
      db.prepare(
        'UPDATE submissions SET score = ?, feedback = ?, status = ? WHERE id = ?'
      ).run(score, JSON.stringify(feedback), 'validated', id);

      logger.info('Submission scored', { id, score });
    } catch (error) {
      logger.error('Failed to update submission score:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a student
   */
  static findByStudent(studentId: string): Submission[] {
    try {
      const submissions = db.prepare(
        'SELECT * FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC'
      ).all(studentId) as Submission[];

      return submissions;
    } catch (error) {
      logger.error('Failed to find submissions by student:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a problem
   */
  static findByProblem(problemId: string): Submission[] {
    try {
      const submissions = db.prepare(
        'SELECT * FROM submissions WHERE problem_id = ? ORDER BY submitted_at DESC'
      ).all(problemId) as Submission[];

      return submissions;
    } catch (error) {
      logger.error('Failed to find submissions by problem:', error);
      throw error;
    }
  }

  /**
   * Get submission with problem details
   */
  static findByIdWithProblem(id: string): (Submission & { problem: Problem }) | null {
    try {
      const result = db.prepare(`
        SELECT
          s.*,
          p.id as problem_id,
          p.title as problem_title,
          p.description as problem_description,
          p.problem_type,
          p.difficulty,
          p.correct_answer,
          p.validation_rules,
          p.hints,
          p.max_attempts,
          p.points
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.id = ?
      `).get(id) as any;

      if (!result) return null;

      // Restructure the result
      const submission: Submission & { problem: Problem } = {
        id: result.id,
        student_id: result.student_id,
        problem_id: result.problem_id,
        answer: result.answer,
        status: result.status,
        score: result.score,
        feedback: result.feedback,
        attempt_number: result.attempt_number,
        time_spent_seconds: result.time_spent_seconds,
        submitted_at: result.submitted_at,
        problem: {
          id: result.problem_id,
          title: result.problem_title,
          description: result.problem_description,
          problem_type: result.problem_type,
          difficulty: result.difficulty,
          correct_answer: result.correct_answer,
          validation_rules: result.validation_rules,
          hints: result.hints,
          max_attempts: result.max_attempts,
          time_limit_seconds: null,
          points: result.points,
          created_at: '',
          updated_at: ''
        }
      };

      return submission;
    } catch (error) {
      logger.error('Failed to find submission with problem:', error);
      throw error;
    }
  }
}

export class CheckpointValidationModel {
  /**
   * Create checkpoint validation records
   */
  static createMultiple(
    submissionId: string,
    validations: Array<{
      validation_type: CheckpointValidation['validation_type'];
      passed: boolean;
      error_message?: string;
      warning_message?: string;
      suggestions?: string[];
    }>
  ): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO checkpoint_validations
        (id, submission_id, validation_type, passed, error_message, warning_message, suggestions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((validations) => {
        for (const validation of validations) {
          stmt.run(
            uuidv4(),
            submissionId,
            validation.validation_type,
            validation.passed ? 1 : 0,
            validation.error_message || null,
            validation.warning_message || null,
            validation.suggestions ? JSON.stringify(validation.suggestions) : null
          );
        }
      });

      insertMany(validations);

      logger.info('Checkpoint validations created', {
        submissionId,
        count: validations.length
      });
    } catch (error) {
      logger.error('Failed to create checkpoint validations:', error);
      throw error;
    }
  }

  /**
   * Get all validations for a submission
   */
  static findBySubmission(submissionId: string): CheckpointValidation[] {
    try {
      const validations = db.prepare(
        'SELECT * FROM checkpoint_validations WHERE submission_id = ? ORDER BY validated_at DESC'
      ).all(submissionId) as CheckpointValidation[];

      return validations;
    } catch (error) {
      logger.error('Failed to find checkpoint validations:', error);
      throw error;
    }
  }

  /**
   * Get latest validation set for a submission
   */
  static findLatestBySubmission(submissionId: string): CheckpointValidation[] {
    try {
      // Get the latest validation timestamp
      const latest = db.prepare(`
        SELECT MAX(validated_at) as latest_time
        FROM checkpoint_validations
        WHERE submission_id = ?
      `).get(submissionId) as { latest_time: string } | undefined;

      if (!latest || !latest.latest_time) {
        return [];
      }

      // Get all validations from that timestamp
      const validations = db.prepare(`
        SELECT * FROM checkpoint_validations
        WHERE submission_id = ? AND validated_at = ?
        ORDER BY validation_type
      `).all(submissionId, latest.latest_time) as CheckpointValidation[];

      return validations;
    } catch (error) {
      logger.error('Failed to find latest checkpoint validations:', error);
      throw error;
    }
  }
}
