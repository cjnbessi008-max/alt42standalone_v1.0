/**
 * Moodle Sync Service
 *
 * Moodle에서 데이터를 동기화하는 서비스
 */

import { getMoodleClient } from '../moodle/client';
import { logger } from '../utils/logger';
import { Pool } from 'pg';

export interface SyncOptions {
  courseId?: number;
  quizId?: number;
  userId?: number;
  full?: boolean;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  recordsFailed: number;
  errors: string[];
}

export class SyncService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * 코스 동기화
   */
  async syncCourses(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      logger.info('Starting course sync...');
      const moodle = getMoodleClient();
      const courses = await moodle.getCourses();

      for (const course of courses) {
        try {
          await this.db.query(
            `
            INSERT INTO courses (moodle_course_id, full_name, short_name, synced_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (moodle_course_id)
            DO UPDATE SET
              full_name = EXCLUDED.full_name,
              short_name = EXCLUDED.short_name,
              synced_at = NOW()
            `,
            [course.id, course.fullname, course.shortname]
          );
          result.recordsSynced++;
        } catch (error: any) {
          result.recordsFailed++;
          result.errors.push(`Course ${course.id}: ${error.message}`);
          logger.error(`Failed to sync course ${course.id}:`, error);
        }
      }

      logger.info(`Course sync completed: ${result.recordsSynced} synced, ${result.recordsFailed} failed`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      logger.error('Course sync failed:', error);
    }

    return result;
  }

  /**
   * 특정 코스의 퀴즈 동기화
   */
  async syncQuizzes(courseId: number): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      logger.info(`Starting quiz sync for course ${courseId}...`);
      const moodle = getMoodleClient();
      const quizzes = await moodle.getQuizzesByCourses([courseId]);

      // Get course UUID from our database
      const courseQuery = await this.db.query(
        'SELECT id FROM courses WHERE moodle_course_id = $1',
        [courseId]
      );

      if (courseQuery.rows.length === 0) {
        throw new Error(`Course ${courseId} not found in database. Sync courses first.`);
      }

      const courseUuid = courseQuery.rows[0].id;

      for (const quiz of quizzes) {
        try {
          await this.db.query(
            `
            INSERT INTO quizzes (
              moodle_quiz_id, course_id, name, intro,
              time_limit, attempts_allowed, grade_method,
              questions_count, sum_grades, synced_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (moodle_quiz_id)
            DO UPDATE SET
              name = EXCLUDED.name,
              intro = EXCLUDED.intro,
              time_limit = EXCLUDED.time_limit,
              attempts_allowed = EXCLUDED.attempts_allowed,
              synced_at = NOW()
            `,
            [
              quiz.id,
              courseUuid,
              quiz.name,
              quiz.intro,
              quiz.timelimit,
              quiz.attempts,
              this.mapGradeMethod(quiz.grademethod),
              0, // Will be updated when questions are synced
              quiz.sumgrades,
            ]
          );
          result.recordsSynced++;
        } catch (error: any) {
          result.recordsFailed++;
          result.errors.push(`Quiz ${quiz.id}: ${error.message}`);
          logger.error(`Failed to sync quiz ${quiz.id}:`, error);
        }
      }

      logger.info(`Quiz sync completed: ${result.recordsSynced} synced, ${result.recordsFailed} failed`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      logger.error('Quiz sync failed:', error);
    }

    return result;
  }

  /**
   * 퀴즈 시도 동기화
   */
  async syncQuizAttempts(quizId: number, userId?: number): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      logger.info(`Starting quiz attempts sync for quiz ${quizId}...`);
      const moodle = getMoodleClient();

      // Get quiz UUID from our database
      const quizQuery = await this.db.query(
        'SELECT id FROM quizzes WHERE moodle_quiz_id = $1',
        [quizId]
      );

      if (quizQuery.rows.length === 0) {
        throw new Error(`Quiz ${quizId} not found in database. Sync quizzes first.`);
      }

      const quizUuid = quizQuery.rows[0].id;

      // Fetch attempts from Moodle
      const attempts = await moodle.getUserAttempts(quizId, userId, 'finished');

      for (const attempt of attempts) {
        try {
          // Get or create user
          const userUuid = await this.getOrCreateUser(attempt.userid);

          // Insert attempt
          await this.db.query(
            `
            INSERT INTO quiz_attempts (
              moodle_attempt_id, quiz_id, user_id, attempt_number,
              state, time_start, time_finish, sum_grades, grade, synced_at
            )
            VALUES ($1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7), $8, $9, NOW())
            ON CONFLICT (moodle_attempt_id)
            DO UPDATE SET
              state = EXCLUDED.state,
              time_finish = EXCLUDED.time_finish,
              sum_grades = EXCLUDED.sum_grades,
              grade = EXCLUDED.grade,
              synced_at = NOW()
            `,
            [
              attempt.id,
              quizUuid,
              userUuid,
              attempt.attempt,
              attempt.state,
              attempt.timestart,
              attempt.timefinish,
              attempt.sumgrades,
              attempt.sumgrades, // Convert to percentage if needed
            ]
          );

          // Sync attempt details (questions and answers)
          await this.syncAttemptDetails(attempt.id);

          result.recordsSynced++;
        } catch (error: any) {
          result.recordsFailed++;
          result.errors.push(`Attempt ${attempt.id}: ${error.message}`);
          logger.error(`Failed to sync attempt ${attempt.id}:`, error);
        }
      }

      logger.info(`Quiz attempts sync completed: ${result.recordsSynced} synced, ${result.recordsFailed} failed`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      logger.error('Quiz attempts sync failed:', error);
    }

    return result;
  }

  /**
   * 시도 상세 정보 동기화 (문제 및 답안)
   */
  private async syncAttemptDetails(attemptId: number): Promise<void> {
    const moodle = getMoodleClient();
    const attemptData = await moodle.getAttemptData(attemptId);

    // Get attempt UUID
    const attemptQuery = await this.db.query(
      'SELECT id, user_id, quiz_id FROM quiz_attempts WHERE moodle_attempt_id = $1',
      [attemptId]
    );

    if (attemptQuery.rows.length === 0) {
      throw new Error(`Attempt ${attemptId} not found in database`);
    }

    const { id: attemptUuid, user_id: userUuid, quiz_id: quizUuid } = attemptQuery.rows[0];

    // Process each question
    for (const question of attemptData.questions) {
      try {
        // Create or update question
        const questionUuid = await this.getOrCreateQuestion(quizUuid, question);

        // Parse answer correctness
        const isCorrect = question.state === 'gradedright' || question.state === 'complete';
        const mark = parseFloat(question.mark) || 0;

        // Insert question attempt
        await this.db.query(
          `
          INSERT INTO question_attempts (
            moodle_attempt_id, quiz_attempt_id, question_id, user_id,
            student_answer, is_correct, max_mark, mark,
            sequence_number, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (quiz_attempt_id, question_id)
          DO UPDATE SET
            student_answer = EXCLUDED.student_answer,
            is_correct = EXCLUDED.is_correct,
            mark = EXCLUDED.mark
          `,
          [
            attemptId,
            attemptUuid,
            questionUuid,
            userUuid,
            this.extractStudentAnswer(question),
            isCorrect,
            question.maxmark,
            mark,
            question.slot,
          ]
        );
      } catch (error) {
        logger.error(`Failed to sync question ${question.slot} for attempt ${attemptId}:`, error);
      }
    }
  }

  /**
   * 사용자 가져오기 또는 생성
   */
  private async getOrCreateUser(moodleUserId: number): Promise<string> {
    // Check if user exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE moodle_user_id = $1',
      [moodleUserId]
    );

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0].id;
    }

    // Fetch user from Moodle
    const moodle = getMoodleClient();
    const users = await moodle.getUsers([moodleUserId]);

    if (users.length === 0) {
      throw new Error(`User ${moodleUserId} not found in Moodle`);
    }

    const user = users[0];

    // Insert user
    const result = await this.db.query(
      `
      INSERT INTO users (moodle_user_id, username, email, first_name, last_name, role, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
      `,
      [user.id, user.username, user.email, user.firstname, user.lastname, 'student']
    );

    return result.rows[0].id;
  }

  /**
   * 질문 가져오기 또는 생성
   */
  private async getOrCreateQuestion(quizUuid: string, question: any): Promise<string> {
    // For now, use a simplified approach - create question with slot number
    // In production, you'd want to match by actual Moodle question ID

    const result = await this.db.query(
      `
      INSERT INTO questions (
        moodle_question_id, quiz_id, question_text, question_type,
        default_mark, synced_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (moodle_question_id)
      DO UPDATE SET synced_at = NOW()
      RETURNING id
      `,
      [
        question.slot, // Using slot as temporary ID
        quizUuid,
        this.extractQuestionText(question.html),
        question.type,
        question.maxmark,
      ]
    );

    return result.rows[0].id;
  }

  /**
   * 학생 답안 추출 (HTML에서)
   */
  private extractStudentAnswer(question: any): string {
    // Simplified - in production, parse HTML properly
    return question.html || '';
  }

  /**
   * 질문 텍스트 추출 (HTML에서)
   */
  private extractQuestionText(html: string): string {
    // Simplified - in production, use proper HTML parser
    return html.replace(/<[^>]*>/g, '').substring(0, 500);
  }

  /**
   * Grade method 매핑
   */
  private mapGradeMethod(gradeMethod: number): string {
    const methods: Record<number, string> = {
      1: 'highest',
      2: 'average',
      3: 'first',
      4: 'last',
    };
    return methods[gradeMethod] || 'highest';
  }
}
