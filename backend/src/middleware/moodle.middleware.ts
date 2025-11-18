import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Pool } from 'pg';

interface MoodleConfig {
  baseUrl: string;
  apiToken: string;
}

interface MoodleResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Moodle Integration Middleware
 * Provides functions to interact with Moodle 3.7 Web Services API
 */
export class MoodleIntegration {
  private baseUrl: string;
  private apiToken: string;
  private db: Pool;

  constructor(config: MoodleConfig, db: Pool) {
    this.baseUrl = config.baseUrl;
    this.apiToken = config.apiToken;
    this.db = db;
  }

  /**
   * Fetch course contents from Moodle
   */
  async getCourseContents(courseId: string): Promise<MoodleResponse> {
    try {
      const endpoint = `${this.baseUrl}/webservice/rest/server.php`;
      const params = {
        wstoken: this.apiToken,
        wsfunction: 'core_course_get_contents',
        moodlewsrestformat: 'json',
        courseid: courseId,
      };

      const response = await axios.get(endpoint, { params });

      await this.logMoodleRequest('core_course_get_contents', endpoint, params, response.data, response.status, true);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      await this.logMoodleRequest('core_course_get_contents', '', {}, error.message, 0, false);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch quiz questions from Moodle
   */
  async getQuizQuestions(quizId: string): Promise<MoodleResponse> {
    try {
      const endpoint = `${this.baseUrl}/webservice/rest/server.php`;
      const params = {
        wstoken: this.apiToken,
        wsfunction: 'mod_quiz_get_quiz_by_courses',
        moodlewsrestformat: 'json',
      };

      const response = await axios.get(endpoint, { params });

      await this.logMoodleRequest('mod_quiz_get_quiz_by_courses', endpoint, params, response.data, response.status, true);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      await this.logMoodleRequest('mod_quiz_get_quiz_by_courses', '', {}, error.message, 0, false);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user information from Moodle
   */
  async getUserInfo(userId: string): Promise<MoodleResponse> {
    try {
      const endpoint = `${this.baseUrl}/webservice/rest/server.php`;
      const params = {
        wstoken: this.apiToken,
        wsfunction: 'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field: 'id',
        'values[0]': userId,
      };

      const response = await axios.get(endpoint, { params });

      await this.logMoodleRequest('core_user_get_users_by_field', endpoint, params, response.data, response.status, true);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      await this.logMoodleRequest('core_user_get_users_by_field', '', {}, error.message, 0, false);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Submit grade to Moodle
   */
  async submitGrade(userId: string, itemId: string, grade: number): Promise<MoodleResponse> {
    try {
      const endpoint = `${this.baseUrl}/webservice/rest/server.php`;
      const params = {
        wstoken: this.apiToken,
        wsfunction: 'core_grades_update_grades',
        moodlewsrestformat: 'json',
        source: 'wrong_move_alert',
        courseid: itemId,
        component: 'mod_quiz',
        activityid: itemId,
        itemnumber: 0,
        'grades[0][studentid]': userId,
        'grades[0][grade]': grade,
      };

      const response = await axios.post(endpoint, null, { params });

      await this.logMoodleRequest('core_grades_update_grades', endpoint, params, response.data, response.status, true);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      await this.logMoodleRequest('core_grades_update_grades', '', {}, error.message, 0, false);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync problem from Moodle to local database
   */
  async syncProblemFromMoodle(moodleQuestionId: string): Promise<MoodleResponse> {
    try {
      // Fetch question from Moodle
      const questionData = await this.getQuizQuestions(moodleQuestionId);

      if (!questionData.success || !questionData.data) {
        return {
          success: false,
          error: 'Failed to fetch question from Moodle',
        };
      }

      // Transform Moodle question to our problem format
      const problem = this.transformMoodleQuestion(questionData.data);

      // Insert into local database
      await this.db.query(
        `INSERT INTO problems (id, title, description, type, correct_answer, steps, difficulty, subject, grade_level, moodle_question_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           updated_at = NOW()`,
        [
          problem.id,
          problem.title,
          problem.description,
          problem.type,
          problem.correctAnswer,
          problem.steps,
          problem.difficulty,
          problem.subject,
          problem.gradeLevel,
          moodleQuestionId,
        ]
      );

      return {
        success: true,
        data: problem,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transform Moodle question format to our problem format
   */
  private transformMoodleQuestion(moodleQuestion: any): any {
    // This is a simplified transformation
    // In production, you'd need to handle various Moodle question types
    return {
      id: `moodle_${moodleQuestion.id}`,
      title: moodleQuestion.name || 'Untitled',
      description: moodleQuestion.questiontext || '',
      type: this.mapMoodleQuestionType(moodleQuestion.qtype),
      correctAnswer: this.extractCorrectAnswer(moodleQuestion),
      steps: null,
      difficulty: 'medium', // Could be derived from question metadata
      subject: '수학',
      gradeLevel: '초등 3학년',
    };
  }

  /**
   * Map Moodle question type to our problem type
   */
  private mapMoodleQuestionType(moodleType: string): string {
    const typeMap: { [key: string]: string } = {
      'multichoice': 'multiple_choice',
      'shortanswer': 'input',
      'numerical': 'input',
      'essay': 'input',
      'truefalse': 'multiple_choice',
    };

    return typeMap[moodleType] || 'input';
  }

  /**
   * Extract correct answer from Moodle question
   */
  private extractCorrectAnswer(moodleQuestion: any): string {
    // Simplified - in production, handle different question types
    if (moodleQuestion.answers && Array.isArray(moodleQuestion.answers)) {
      const correctAnswer = moodleQuestion.answers.find((a: any) => a.fraction > 0);
      return correctAnswer ? correctAnswer.text : '';
    }
    return '';
  }

  /**
   * Log Moodle API request to database
   */
  private async logMoodleRequest(
    operation: string,
    endpoint: string,
    requestData: any,
    responseData: any,
    statusCode: number,
    success: boolean
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO moodle_integration_log (operation, moodle_endpoint, request_data, response_data, status_code, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          operation,
          endpoint,
          JSON.stringify(requestData),
          JSON.stringify(responseData),
          statusCode,
          success,
          success ? null : String(responseData),
        ]
      );
    } catch (error) {
      console.error('Failed to log Moodle request:', error);
    }
  }
}

/**
 * Express middleware to attach Moodle integration
 */
export const attachMoodleIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db: Pool = req.app.locals.db;

    // Fetch Moodle config from database
    const configResult = await db.query(
      `SELECT key, value FROM system_config WHERE key IN ('moodle_base_url', 'moodle_api_token')`
    );

    const config: any = {};
    configResult.rows.forEach(row => {
      const key = row.key.replace('moodle_', '');
      config[key] = JSON.parse(row.value);
    });

    if (!config.baseUrl || !config.apiToken) {
      console.warn('Moodle configuration not complete');
      req.app.locals.moodle = null;
      return next();
    }

    // Create Moodle integration instance
    req.app.locals.moodle = new MoodleIntegration(
      {
        baseUrl: config.baseUrl,
        apiToken: config.apiToken,
      },
      db
    );

    next();
  } catch (error) {
    console.error('Error initializing Moodle integration:', error);
    req.app.locals.moodle = null;
    next();
  }
};

export default MoodleIntegration;
