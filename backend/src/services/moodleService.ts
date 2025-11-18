import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';
import { Problem } from '../types';

dotenv.config();

interface MoodleConfig {
  url: string;
  token: string;
  service: string;
}

class MoodleService {
  private axiosInstance: AxiosInstance;
  private config: MoodleConfig;

  constructor() {
    this.config = {
      url: process.env.MOODLE_URL || '',
      token: process.env.MOODLE_API_TOKEN || '',
      service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
    };

    this.axiosInstance = axios.create({
      baseURL: `${this.config.url}/webservice/rest/server.php`,
      params: {
        wstoken: this.config.token,
        moodlewsrestformat: 'json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test Moodle connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'core_webservice_get_site_info',
        },
      });

      if (response.data && !response.data.exception) {
        console.log('✓ Moodle connection successful');
        console.log('  Site:', response.data.sitename);
        console.log('  Version:', response.data.release);
        return true;
      }

      console.error('✗ Moodle connection failed:', response.data);
      return false;
    } catch (error) {
      console.error('✗ Moodle connection error:', error);
      return false;
    }
  }

  /**
   * Get quiz questions from Moodle
   * @param quizId - Moodle quiz ID
   */
  async getQuizQuestions(quizId: number): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_access_information',
          quizid: quizId,
        },
      });

      if (response.data && !response.data.exception) {
        await this.logSync('problem_import', 'mod_quiz_get_quiz_access_information', { quizId }, response.data, 'success');
        return response.data.questions || [];
      }

      await this.logSync('problem_import', 'mod_quiz_get_quiz_access_information', { quizId }, response.data, 'failed', response.data.message);
      return [];
    } catch (error: any) {
      await this.logSync('problem_import', 'mod_quiz_get_quiz_access_information', { quizId }, null, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Import Moodle quiz question as Problem
   * @param moodleQuestion - Moodle question object
   */
  async importQuestionAsProblem(moodleQuestion: any): Promise<Problem | null> {
    try {
      // Parse Moodle question to our Problem format
      const problem: Problem = {
        moodle_problem_id: moodleQuestion.id,
        title: this.stripHtml(moodleQuestion.name || 'Untitled'),
        description: this.stripHtml(moodleQuestion.questiontext || ''),
        problem_type: this.mapQuestionType(moodleQuestion.qtype),
        difficulty_level: 'medium', // Default, can be enhanced
        target_grade: 3, // Default, can be enhanced
        numbers: this.extractNumbers(moodleQuestion.questiontext || ''),
        correct_answer: this.extractCorrectAnswer(moodleQuestion),
        visualization_config: {
          object_type: 'flower',
          layout: 'grid',
          show_labels: true,
        },
        is_active: true,
      };

      return problem;
    } catch (error) {
      console.error('Error importing question:', error);
      return null;
    }
  }

  /**
   * Export student results back to Moodle
   * @param moodleUserId - Moodle user ID
   * @param quizId - Quiz ID
   * @param results - Student results
   */
  async exportResults(
    moodleUserId: number,
    quizId: number,
    results: { questionId: number; answer: string; isCorrect: boolean }[]
  ): Promise<boolean> {
    try {
      // This would depend on your Moodle setup and permissions
      // For now, just log the export attempt
      await this.logSync(
        'result_export',
        'mod_quiz_save_attempt',
        { moodleUserId, quizId, results },
        null,
        'pending',
        'Export functionality to be implemented based on Moodle configuration'
      );

      return true;
    } catch (error: any) {
      await this.logSync(
        'result_export',
        'mod_quiz_save_attempt',
        { moodleUserId, quizId, results },
        null,
        'failed',
        error.message
      );
      return false;
    }
  }

  /**
   * Helper: Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Helper: Map Moodle question type to our problem type
   */
  private mapQuestionType(qtype: string): Problem['problem_type'] {
    const typeMap: { [key: string]: Problem['problem_type'] } = {
      numerical: 'addition',
      calculated: 'addition',
      multichoice: 'number_comparison',
      shortanswer: 'addition',
      truefalse: 'number_comparison',
    };

    return typeMap[qtype] || 'number_comparison';
  }

  /**
   * Helper: Extract numbers from question text
   */
  private extractNumbers(text: string): number[] {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map((n) => parseInt(n)).slice(0, 10) : [1, 2, 3];
  }

  /**
   * Helper: Extract correct answer from Moodle question
   */
  private extractCorrectAnswer(question: any): string {
    // This is simplified - actual implementation would depend on question structure
    if (question.answers && question.answers.length > 0) {
      const correctAnswer = question.answers.find((a: any) => a.fraction > 0);
      return correctAnswer ? this.stripHtml(correctAnswer.text) : '0';
    }
    return '0';
  }

  /**
   * Helper: Log sync activity to database
   */
  private async logSync(
    sync_type: 'problem_import' | 'result_export' | 'user_sync',
    endpoint: string,
    request_data: any,
    response_data: any,
    status: 'success' | 'failed' | 'pending',
    error_message?: string
  ): Promise<void> {
    try {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO moodle_sync_log
         (sync_type, moodle_endpoint, request_data, response_data, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sync_type,
          endpoint,
          JSON.stringify(request_data),
          response_data ? JSON.stringify(response_data) : null,
          status,
          error_message || null,
        ]
      );
    } catch (error) {
      console.error('Failed to log Moodle sync:', error);
    }
  }
}

export default new MoodleService();
