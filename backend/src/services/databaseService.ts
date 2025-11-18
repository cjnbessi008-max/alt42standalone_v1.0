import { pool } from '../config/database';
import { MoodleQuestion, MoodleQuestionAnswer, TrapPoint } from '../types';
import { RowDataPacket } from 'mysql2';

export class DatabaseService {
  /**
   * Get question from Moodle database
   */
  async getQuestion(questionId: number): Promise<MoodleQuestion | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
          id,
          questiontext,
          questiontextformat,
          qtype,
          name,
          penalty,
          defaultmark
        FROM mdl_question
        WHERE id = ?`,
        [questionId]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as MoodleQuestion;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  /**
   * Get question answers from Moodle database
   */
  async getQuestionAnswers(
    questionId: number
  ): Promise<MoodleQuestionAnswer[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
          id,
          answer,
          fraction,
          feedback
        FROM mdl_question_answers
        WHERE question = ?
        ORDER BY id`,
        [questionId]
      );

      return rows as MoodleQuestionAnswer[];
    } catch (error) {
      console.error('Error fetching question answers:', error);
      throw error;
    }
  }

  /**
   * Get questions for a quiz
   */
  async getQuizQuestions(quizId: number): Promise<MoodleQuestion[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          q.id,
          q.questiontext,
          q.questiontextformat,
          q.qtype,
          q.name,
          q.penalty,
          q.defaultmark
        FROM mdl_question q
        INNER JOIN mdl_quiz_slots qs ON q.id = qs.questionid
        WHERE qs.quizid = ?
        ORDER BY qs.slot`,
        [quizId]
      );

      return rows as MoodleQuestion[];
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      throw error;
    }
  }

  /**
   * Get trap points for a question
   */
  async getTrapPoints(questionId: number): Promise<TrapPoint[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
          id,
          question_id as questionId,
          trap_type as type,
          position_x,
          position_y,
          position_width,
          position_height,
          severity,
          description,
          error_rate as errorRate,
          created_at as createdAt
        FROM alt42_trap_points
        WHERE question_id = ?`,
        [questionId]
      );

      return rows.map((row) => ({
        id: row.id,
        questionId: row.questionId,
        type: row.type,
        position: {
          x: parseFloat(row.position_x),
          y: parseFloat(row.position_y),
          width: parseFloat(row.position_width),
          height: parseFloat(row.position_height),
        },
        severity: row.severity,
        description: row.description,
        errorRate: parseFloat(row.errorRate),
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching trap points:', error);
      throw error;
    }
  }

  /**
   * Create or update trap point
   */
  async upsertTrapPoint(trapPoint: Omit<TrapPoint, 'id'>): Promise<number> {
    try {
      const [result] = await pool.query(
        `INSERT INTO alt42_trap_points
        (question_id, trap_type, position_x, position_y, position_width, position_height, severity, description, error_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          trap_type = VALUES(trap_type),
          position_x = VALUES(position_x),
          position_y = VALUES(position_y),
          position_width = VALUES(position_width),
          position_height = VALUES(position_height),
          severity = VALUES(severity),
          description = VALUES(description),
          error_rate = VALUES(error_rate)`,
        [
          trapPoint.questionId,
          trapPoint.type,
          trapPoint.position.x,
          trapPoint.position.y,
          trapPoint.position.width,
          trapPoint.position.height,
          trapPoint.severity,
          trapPoint.description,
          trapPoint.errorRate,
        ]
      );

      return (result as any).insertId;
    } catch (error) {
      console.error('Error upserting trap point:', error);
      throw error;
    }
  }

  /**
   * Delete trap point
   */
  async deleteTrapPoint(trapPointId: number): Promise<boolean> {
    try {
      const [result] = await pool.query(
        `DELETE FROM alt42_trap_points WHERE id = ?`,
        [trapPointId]
      );

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error deleting trap point:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
