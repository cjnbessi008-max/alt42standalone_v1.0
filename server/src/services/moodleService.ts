import axios from 'axios';
import { moodlePool } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  qtype: string;
  category: number;
}

interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

export class MoodleService {
  private moodleUrl: string;
  private apiToken: string;

  constructor() {
    this.moodleUrl = process.env.MOODLE_URL || '';
    this.apiToken = process.env.MOODLE_API_TOKEN || '';
  }

  /**
   * Fetch questions from Moodle via Web Service API
   */
  async getQuestions(courseId: number): Promise<MoodleQuestion[]> {
    try {
      // First, try using Moodle Web Service API if configured
      if (this.moodleUrl && this.apiToken) {
        const response = await axios.get(`${this.moodleUrl}/webservice/rest/server.php`, {
          params: {
            wstoken: this.apiToken,
            wsfunction: 'core_question_get_questions',
            moodlewsrestformat: 'json',
            courseid: courseId
          }
        });

        return response.data;
      }

      // Fallback: Direct database query (read-only)
      const [rows] = await moodlePool.query(`
        SELECT
          q.id,
          q.name,
          q.questiontext,
          q.qtype,
          q.category
        FROM mdl_question q
        JOIN mdl_question_categories qc ON q.category = qc.id
        WHERE qc.contextid IN (
          SELECT ctx.id
          FROM mdl_context ctx
          WHERE ctx.instanceid = ? AND ctx.contextlevel = 50
        )
        ORDER BY q.id DESC
        LIMIT 100
      `, [courseId]);

      return rows as MoodleQuestion[];
    } catch (error: any) {
      console.error('Error fetching Moodle questions:', error);
      throw createError('Failed to fetch questions from Moodle', 500, error.message);
    }
  }

  /**
   * Get specific question by ID
   */
  async getQuestionById(questionId: number): Promise<MoodleQuestion | null> {
    try {
      const [rows] = await moodlePool.query(`
        SELECT
          q.id,
          q.name,
          q.questiontext,
          q.qtype,
          q.category
        FROM mdl_question q
        WHERE q.id = ?
      `, [questionId]);

      const questions = rows as MoodleQuestion[];
      return questions.length > 0 ? questions[0] : null;
    } catch (error: any) {
      console.error('Error fetching Moodle question:', error);
      throw createError('Failed to fetch question from Moodle', 500, error.message);
    }
  }

  /**
   * Authenticate user and create session
   */
  async authenticate(username: string, token: string): Promise<any> {
    try {
      // Verify token with Moodle
      if (this.moodleUrl && this.apiToken) {
        const response = await axios.get(`${this.moodleUrl}/webservice/rest/server.php`, {
          params: {
            wstoken: token,
            wsfunction: 'core_webservice_get_site_info',
            moodlewsrestformat: 'json'
          }
        });

        if (response.data.userid) {
          // Create JWT session token
          const sessionToken = jwt.sign(
            { userId: response.data.userid, username: response.data.username },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
          );

          return {
            sessionToken,
            userId: response.data.userid,
            username: response.data.username,
            expiresIn: 86400 // 24 hours
          };
        }
      }

      throw createError('Authentication failed', 401);
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw createError('Authentication failed', 401, error.message);
    }
  }

  /**
   * Get user information from Moodle
   */
  async getUserInfo(userId: number): Promise<MoodleUser | null> {
    try {
      const [rows] = await moodlePool.query(`
        SELECT
          id,
          username,
          firstname,
          lastname,
          email
        FROM mdl_user
        WHERE id = ?
      `, [userId]);

      const users = rows as MoodleUser[];
      return users.length > 0 ? users[0] : null;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      throw createError('Failed to fetch user information', 500, error.message);
    }
  }
}
