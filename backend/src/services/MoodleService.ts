/**
 * Moodle LMS 연동 서비스
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경과 호환
 */

import axios from 'axios';
import mysql from 'mysql2/promise';
import type { MoodleProblem } from '../types/IntegralProblem.js';

export class MoodleService {
  private moodleUrl: string;
  private token: string;
  private dbConfig: mysql.PoolOptions;
  private pool?: mysql.Pool;

  constructor() {
    this.moodleUrl = process.env.MOODLE_URL || '';
    this.token = process.env.MOODLE_TOKEN || '';

    this.dbConfig = {
      host: process.env.MOODLE_DB_HOST || 'localhost',
      port: parseInt(process.env.MOODLE_DB_PORT || '3306'),
      database: process.env.MOODLE_DB_NAME || 'moodle',
      user: process.env.MOODLE_DB_USER || 'root',
      password: process.env.MOODLE_DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  /**
   * DB 연결 풀 초기화
   */
  private async initPool(): Promise<void> {
    if (!this.pool) {
      this.pool = mysql.createPool(this.dbConfig);
    }
  }

  /**
   * Moodle Web Service API를 통해 문제 가져오기
   */
  async getProblemsViaAPI(categoryId?: number): Promise<MoodleProblem[]> {
    try {
      const response = await axios.get(`${this.moodleUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: 'core_question_get_random_question_summaries',
          moodlewsrestformat: 'json',
          categoryid: categoryId || 0,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Moodle API 호출 실패:', error);
      throw new Error('Moodle 서버에서 문제를 가져올 수 없습니다.');
    }
  }

  /**
   * MySQL 직접 연결로 적분 문제 가져오기
   * Moodle의 mdl_question 테이블에서 데이터 조회
   */
  async getIntegralProblemsFromDB(limit: number = 10): Promise<MoodleProblem[]> {
    await this.initPool();

    if (!this.pool) {
      throw new Error('데이터베이스 연결 실패');
    }

    try {
      const [rows] = await this.pool.execute(
        `SELECT
          q.id,
          q.questiontext,
          q.qtype as questiontype,
          q.category,
          qc.name as categoryname,
          q.difficulty
        FROM mdl_question q
        LEFT JOIN mdl_question_categories qc ON q.category = qc.id
        WHERE q.qtype = 'calculated'
          OR q.qtype = 'numerical'
          OR (q.questiontext LIKE '%integral%' OR q.questiontext LIKE '%적분%')
        ORDER BY q.id DESC
        LIMIT ?`,
        [limit]
      );

      return rows as MoodleProblem[];
    } catch (error) {
      console.error('Moodle DB 조회 실패:', error);
      throw new Error('데이터베이스에서 문제를 가져올 수 없습니다.');
    }
  }

  /**
   * 특정 문제 ID로 문제 상세 정보 가져오기
   */
  async getProblemById(questionId: number): Promise<MoodleProblem | null> {
    await this.initPool();

    if (!this.pool) {
      throw new Error('데이터베이스 연결 실패');
    }

    try {
      const [rows] = await this.pool.execute(
        `SELECT
          q.id,
          q.questiontext,
          q.qtype as questiontype,
          q.category,
          q.difficulty,
          qa.attribute,
          qa.value
        FROM mdl_question q
        LEFT JOIN mdl_question_attributes qa ON q.id = qa.questionid
        WHERE q.id = ?`,
        [questionId]
      );

      const result = rows as any[];
      if (result.length === 0) return null;

      return result[0] as MoodleProblem;
    } catch (error) {
      console.error('문제 조회 실패:', error);
      return null;
    }
  }

  /**
   * 연결 종료
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
