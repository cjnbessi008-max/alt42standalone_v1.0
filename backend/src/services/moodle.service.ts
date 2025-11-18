import { RowDataPacket } from 'mysql2';
import { moodleDb } from '../config/database';
import logger from '../utils/logger';

export interface MoodleUser {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
}

export interface MoodleQuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state: string;
  timestart: number;
  timefinish: number;
  timemodified: number;
}

export interface MoodleQuestionAttempt {
  id: number;
  questionusageid: number;
  slot: number;
  behaviour: string;
  questionid: number;
  variant: number;
  maxmark: number;
  minfraction: number;
  maxfraction: number;
  flagged: number;
  questionsummary: string;
  rightanswer: string;
  responsesummary: string;
  timemodified: number;
}

export interface QuizResult {
  attemptId: number;
  userId: number;
  quizId: number;
  correctAnswers: number;
  totalQuestions: number;
  isCorrectAnswer: boolean;
  timefinish: number;
}

class MoodleService {
  /**
   * Moodle 사용자 정보 가져오기
   */
  async getUser(userId: number): Promise<MoodleUser | null> {
    try {
      const [rows] = await moodleDb.query<RowDataPacket[]>(
        'SELECT id, username, email, firstname, lastname FROM mdl_user WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) return null;

      return rows[0] as MoodleUser;
    } catch (error) {
      logger.error('Error fetching Moodle user:', error);
      throw error;
    }
  }

  /**
   * 특정 시간 이후의 퀴즈 시도 가져오기
   */
  async getRecentQuizAttempts(afterTimestamp: number): Promise<MoodleQuizAttempt[]> {
    try {
      const [rows] = await moodleDb.query<RowDataPacket[]>(
        `SELECT id, quiz, userid, attempt, state, timestart, timefinish, timemodified
         FROM mdl_quiz_attempts
         WHERE timemodified > ? AND state = 'finished'
         ORDER BY timemodified ASC
         LIMIT 100`,
        [afterTimestamp]
      );

      return rows as MoodleQuizAttempt[];
    } catch (error) {
      logger.error('Error fetching recent quiz attempts:', error);
      throw error;
    }
  }

  /**
   * 특정 퀴즈 시도의 질문 답변 분석
   */
  async analyzeQuizAttempt(attemptId: number): Promise<QuizResult | null> {
    try {
      // 퀴즈 시도 정보 가져오기
      const [attemptRows] = await moodleDb.query<RowDataPacket[]>(
        'SELECT * FROM mdl_quiz_attempts WHERE id = ?',
        [attemptId]
      );

      if (attemptRows.length === 0) return null;

      const attempt = attemptRows[0] as MoodleQuizAttempt;

      // 질문 사용 ID 가져오기
      const [usageRows] = await moodleDb.query<RowDataPacket[]>(
        'SELECT uniqueid FROM mdl_quiz_attempts WHERE id = ?',
        [attemptId]
      );

      if (usageRows.length === 0) return null;

      const questionUsageId = usageRows[0].uniqueid;

      // 질문 시도 분석
      const [questionRows] = await moodleDb.query<RowDataPacket[]>(
        `SELECT qa.*, qas.state, qas.fraction
         FROM mdl_question_attempts qa
         LEFT JOIN mdl_question_attempt_steps qas ON qa.id = qas.questionattemptid
         WHERE qa.questionusageid = ?
         AND qas.sequencenumber = (
           SELECT MAX(sequencenumber)
           FROM mdl_question_attempt_steps
           WHERE questionattemptid = qa.id
         )`,
        [questionUsageId]
      );

      let correctAnswers = 0;
      const totalQuestions = questionRows.length;

      // 정답 개수 계산 (fraction >= 0.9999를 정답으로 간주)
      questionRows.forEach((row: any) => {
        if (row.fraction && parseFloat(row.fraction) >= 0.9999) {
          correctAnswers++;
        }
      });

      // 마지막 질문이 정답인지 확인
      const lastQuestion = questionRows[questionRows.length - 1];
      const isCorrectAnswer = lastQuestion?.fraction && parseFloat(lastQuestion.fraction) >= 0.9999;

      return {
        attemptId: attempt.id,
        userId: attempt.userid,
        quizId: attempt.quiz,
        correctAnswers,
        totalQuestions,
        isCorrectAnswer: !!isCorrectAnswer,
        timefinish: attempt.timefinish,
      };
    } catch (error) {
      logger.error('Error analyzing quiz attempt:', error);
      throw error;
    }
  }

  /**
   * 사용자의 최근 정답 연속 횟수 계산
   */
  async getUserCorrectStreak(userId: number, limit: number = 10): Promise<number> {
    try {
      // 최근 퀴즈 시도 가져오기
      const [rows] = await moodleDb.query<RowDataPacket[]>(
        `SELECT id FROM mdl_quiz_attempts
         WHERE userid = ? AND state = 'finished'
         ORDER BY timefinish DESC
         LIMIT ?`,
        [userId, limit]
      );

      let streak = 0;

      // 최근 시도부터 정답 연속 횟수 계산
      for (const row of rows) {
        const result = await this.analyzeQuizAttempt(row.id);
        if (result && result.isCorrectAnswer) {
          streak++;
        } else {
          break; // 틀린 답이 나오면 중단
        }
      }

      return streak;
    } catch (error) {
      logger.error('Error calculating user correct streak:', error);
      return 0;
    }
  }

  /**
   * 퀴즈 정보 가져오기
   */
  async getQuiz(quizId: number): Promise<any> {
    try {
      const [rows] = await moodleDb.query<RowDataPacket[]>(
        'SELECT * FROM mdl_quiz WHERE id = ?',
        [quizId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error fetching quiz:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      const connection = await moodleDb.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      logger.error('Moodle database connection test failed:', error);
      return false;
    }
  }
}

export default new MoodleService();
