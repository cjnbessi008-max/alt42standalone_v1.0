/**
 * Analysis Service
 *
 * 확신 오답 분석 로직
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface ConfidentWrongAnswer {
  id: string;
  userId: string;
  username: string;
  questionId: string;
  questionText: string;
  conceptTag: string | null;
  confidenceLevel: number;
  studentAnswer: string;
  correctAnswer: string | null;
  quizName: string;
  courseName: string;
  createdAt: Date;
}

export interface ConceptWeakness {
  conceptTag: string;
  totalAttempts: number;
  confidentWrongCount: number;
  confidentWrongRate: number;
}

export interface StudentConfidenceAccuracy {
  userId: string;
  username: string;
  confidenceLevel: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export class AnalysisService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * 학생의 확신 오답 목록 가져오기
   */
  async getConfidentWrongAnswers(
    userId: string,
    confidenceThreshold: number = 4
  ): Promise<ConfidentWrongAnswer[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          qa.id,
          qa.user_id as "userId",
          u.username,
          qa.question_id as "questionId",
          q.question_text as "questionText",
          q.concept_tag as "conceptTag",
          qa.confidence_level as "confidenceLevel",
          qa.student_answer as "studentAnswer",
          q.correct_answer as "correctAnswer",
          qz.name as "quizName",
          c.full_name as "courseName",
          qa.created_at as "createdAt"
        FROM question_attempts qa
        JOIN users u ON qa.user_id = u.id
        JOIN questions q ON qa.question_id = q.id
        JOIN quizzes qz ON q.quiz_id = qz.id
        JOIN courses c ON qz.course_id = c.id
        WHERE qa.user_id = $1
          AND qa.is_correct = false
          AND qa.confidence_level >= $2
        ORDER BY qa.created_at DESC
        `,
        [userId, confidenceThreshold]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to fetch confident wrong answers:', error);
      throw error;
    }
  }

  /**
   * 개념별 취약점 분석
   */
  async getConceptWeaknesses(
    userId: string,
    confidenceThreshold: number = 4
  ): Promise<ConceptWeakness[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          q.concept_tag as "conceptTag",
          COUNT(*) as "totalAttempts",
          SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) as "confidentWrongCount",
          ROUND(
            100.0 * SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) / COUNT(*),
            2
          ) as "confidentWrongRate"
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        WHERE qa.user_id = $1
          AND qa.confidence_level >= $2
          AND q.concept_tag IS NOT NULL
        GROUP BY q.concept_tag
        HAVING SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) > 0
        ORDER BY "confidentWrongRate" DESC
        `,
        [userId, confidenceThreshold]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to analyze concept weaknesses:', error);
      throw error;
    }
  }

  /**
   * 학생의 확신도 정확성 분석
   */
  async getConfidenceAccuracy(userId: string): Promise<StudentConfidenceAccuracy[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          qa.user_id as "userId",
          u.username,
          qa.confidence_level as "confidenceLevel",
          COUNT(*) as "totalAnswers",
          SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as "correctAnswers",
          ROUND(
            100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(*),
            2
          ) as "accuracyPercentage"
        FROM question_attempts qa
        JOIN users u ON qa.user_id = u.id
        WHERE qa.user_id = $1
          AND qa.confidence_level IS NOT NULL
        GROUP BY qa.user_id, u.username, qa.confidence_level
        ORDER BY qa.confidence_level
        `,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to analyze confidence accuracy:', error);
      throw error;
    }
  }

  /**
   * 학급 전체 확신 오답 통계
   */
  async getClassConfidentWrongStats(
    courseId: string,
    confidenceThreshold: number = 4
  ): Promise<any> {
    try {
      const result = await this.db.query(
        `
        SELECT
          u.id as "userId",
          u.username,
          u.first_name as "firstName",
          u.last_name as "lastName",
          COUNT(*) as "confidentWrongCount",
          ARRAY_AGG(DISTINCT q.concept_tag) FILTER (WHERE q.concept_tag IS NOT NULL) as "weakConcepts"
        FROM question_attempts qa
        JOIN users u ON qa.user_id = u.id
        JOIN questions q ON qa.question_id = q.id
        JOIN quizzes qz ON q.quiz_id = qz.id
        WHERE qz.course_id = $1
          AND qa.is_correct = false
          AND qa.confidence_level >= $2
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY "confidentWrongCount" DESC
        `,
        [courseId, confidenceThreshold]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get class confident wrong stats:', error);
      throw error;
    }
  }

  /**
   * 확신 오답 분석 결과 저장
   */
  async saveConfidentWrongAnalysis(
    questionAttemptId: string,
    aiAnalysis: any,
    misconceptionType: string,
    recommendedResources: string[],
    priorityLevel: number = 3
  ): Promise<string> {
    try {
      // Get question attempt details
      const qaResult = await this.db.query(
        `
        SELECT user_id, question_id, confidence_level
        FROM question_attempts
        WHERE id = $1
        `,
        [questionAttemptId]
      );

      if (qaResult.rows.length === 0) {
        throw new Error('Question attempt not found');
      }

      const { user_id, question_id, confidence_level } = qaResult.rows[0];

      // Get concept tag
      const conceptResult = await this.db.query(
        'SELECT concept_tag FROM questions WHERE id = $1',
        [question_id]
      );

      const conceptTag = conceptResult.rows[0]?.concept_tag;

      // Insert analysis
      const result = await this.db.query(
        `
        INSERT INTO confidence_wrong_answers (
          question_attempt_id, user_id, question_id, confidence_level,
          concept_tag, misconception_type, ai_analysis,
          recommended_resources, priority_level, analyzed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (question_attempt_id)
        DO UPDATE SET
          ai_analysis = EXCLUDED.ai_analysis,
          misconception_type = EXCLUDED.misconception_type,
          recommended_resources = EXCLUDED.recommended_resources,
          priority_level = EXCLUDED.priority_level,
          analyzed_at = NOW()
        RETURNING id
        `,
        [
          questionAttemptId,
          user_id,
          question_id,
          confidence_level,
          conceptTag,
          misconceptionType,
          JSON.stringify(aiAnalysis),
          recommendedResources,
          priorityLevel,
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to save confident wrong analysis:', error);
      throw error;
    }
  }
}
