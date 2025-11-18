import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';
const MOODLE_SERVICE = process.env.MOODLE_SERVICE || 'moodle_mobile_app';

export interface MoodleQuestion {
  id: string;
  name: string;
  questiontext: string;
  questiontype: string;
  answer?: string;
}

/**
 * Moodle Web Service API 클라이언트
 */
export class MoodleService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = `${MOODLE_URL}/webservice/rest/server.php`;
    this.token = MOODLE_TOKEN;
  }

  /**
   * Generic Moodle API call
   */
  private async callApi(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      console.error('Moodle API call failed:', error);
      throw error;
    }
  }

  /**
   * Get quiz questions from Moodle
   */
  async getQuizQuestions(quizId: string): Promise<MoodleQuestion[]> {
    const data = await this.callApi('mod_quiz_get_quiz_data', {
      quizid: quizId,
    });

    return data.questions || [];
  }

  /**
   * Get specific question by ID
   */
  async getQuestion(questionId: string): Promise<MoodleQuestion | null> {
    try {
      const data = await this.callApi('core_question_get_question_data', {
        questionid: questionId,
      });

      return data || null;
    } catch (error) {
      console.error('Failed to get question:', error);
      return null;
    }
  }

  /**
   * Parse inequality from Moodle question
   * This is a placeholder - implement based on your Moodle question format
   */
  parseInequality(question: MoodleQuestion): string | null {
    try {
      // Example: Extract inequality from question text
      // This depends on how inequalities are formatted in your Moodle questions
      const text = question.questiontext;

      // Simple regex to find inequality patterns
      const inequalityPattern = /x\s*[<>]=?\s*-?\d+(\.\d+)?|(-?\d+(\.\d+)?)\s*[<>]=?\s*x\s*[<>]=?\s*(-?\d+(\.\d+)?)/g;
      const match = text.match(inequalityPattern);

      return match ? match[0] : null;
    } catch (error) {
      console.error('Failed to parse inequality:', error);
      return null;
    }
  }

  /**
   * Test Moodle connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const data = await this.callApi('core_webservice_get_site_info');
      console.log('✓ Moodle connected:', data.sitename);
      return true;
    } catch (error) {
      console.error('✗ Moodle connection failed');
      return false;
    }
  }

  /**
   * Sync questions from Moodle quiz
   */
  async syncQuizQuestions(quizId: string): Promise<MoodleQuestion[]> {
    const questions = await this.getQuizQuestions(quizId);

    // Filter for inequality questions (customize based on your needs)
    const inequalityQuestions = questions.filter((q) =>
      this.parseInequality(q) !== null
    );

    return inequalityQuestions;
  }
}

export const moodleService = new MoodleService();
