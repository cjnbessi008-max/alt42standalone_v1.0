import { query } from '../config/database.js';
import moodleService from './moodleService.js';
import { Problem, sampleProblems } from '../models/Problem.js';

export class ProblemService {
  /**
   * Get a problem by ID from database
   */
  async getProblemById(id: number): Promise<Problem | null> {
    try {
      const result: any = await query('SELECT * FROM problems WHERE id = ?', [id]);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        functionExpression: row.function_expression,
        domain: JSON.parse(row.domain),
        point: row.point,
        questionType: row.question_type,
        moodleQuestionId: row.moodle_question_id,
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error('Error getting problem:', error);
      return null;
    }
  }

  /**
   * Get a random problem (from sample or database)
   */
  async getRandomProblem(): Promise<Problem> {
    try {
      const result: any = await query('SELECT * FROM problems ORDER BY RAND() LIMIT 1');

      if (result.length > 0) {
        const row = result[0];
        return {
          id: row.id,
          functionExpression: row.function_expression,
          domain: JSON.parse(row.domain),
          point: row.point,
          questionType: row.question_type,
          moodleQuestionId: row.moodle_question_id,
        };
      }
    } catch (error) {
      console.warn('Database query failed, using sample problems:', error);
    }

    // Fallback to sample problems
    const randomIndex = Math.floor(Math.random() * sampleProblems.length);
    return sampleProblems[randomIndex];
  }

  /**
   * Get problem from Moodle
   */
  async getProblemFromMoodle(quizId: number): Promise<Problem | null> {
    try {
      const questions = await moodleService.getQuizQuestions(quizId);

      if (questions.length === 0) {
        return null;
      }

      // Get first question
      const moodleQuestion = questions[0];
      return moodleService.parseMoodleQuestion(moodleQuestion);
    } catch (error) {
      console.error('Error getting problem from Moodle:', error);
      return null;
    }
  }

  /**
   * Save problem to database
   */
  async saveProblem(problem: Problem): Promise<number> {
    try {
      const result: any = await query(
        `INSERT INTO problems (function_expression, domain, point, question_type, moodle_question_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          problem.functionExpression,
          JSON.stringify(problem.domain),
          problem.point,
          problem.questionType,
          problem.moodleQuestionId || null,
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error saving problem:', error);
      throw error;
    }
  }

  /**
   * Get all problems
   */
  async getAllProblems(): Promise<Problem[]> {
    try {
      const result: any = await query('SELECT * FROM problems ORDER BY created_at DESC');

      return result.map((row: any) => ({
        id: row.id,
        functionExpression: row.function_expression,
        domain: JSON.parse(row.domain),
        point: row.point,
        questionType: row.question_type,
        moodleQuestionId: row.moodle_question_id,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.warn('Database query failed, returning sample problems:', error);
      return sampleProblems;
    }
  }
}

export default new ProblemService();
