import axios from 'axios';
import { moodleConfig } from '../config/moodle.js';
import type { Problem } from '../models/Problem.js';

/**
 * Moodle Web Services Integration
 * Connects to Moodle LMS to fetch questions and submit grades
 */
export class MoodleService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = moodleConfig.baseUrl;
    this.token = moodleConfig.wsToken;
  }

  /**
   * Call a Moodle Web Service function
   */
  private async callMoodleWS(functionName: string, params: any = {}) {
    try {
      const endpoint = moodleConfig.getEndpoint(functionName);
      const response = await axios.post(endpoint, null, { params });

      if (response.data.exception) {
        throw new Error(`Moodle Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('Moodle Web Service Error:', error);
      throw error;
    }
  }

  /**
   * Get quiz questions from Moodle course
   */
  async getQuizQuestions(quizId: number): Promise<any[]> {
    try {
      const data = await this.callMoodleWS('mod_quiz_get_quiz_access_information', {
        quizid: quizId,
      });

      return data.questions || [];
    } catch (error) {
      console.error('Failed to get quiz questions:', error);
      return [];
    }
  }

  /**
   * Convert Moodle question to Problem format
   */
  parseMoodleQuestion(moodleQuestion: any): Problem | null {
    try {
      // Parse question text to extract function expression
      // This is a simplified parser - you may need to customize based on your Moodle question format
      const questionText = moodleQuestion.questiontext || '';

      // Example format: "Find the derivative of f(x) = x^2 at x = 1.5"
      const functionMatch = questionText.match(/f\(x\)\s*=\s*([^,\s]+)/);
      const pointMatch = questionText.match(/x\s*=\s*([\d.]+)/);
      const domainMatch = questionText.match(/domain\s*\[(-?[\d.]+),\s*(-?[\d.]+)\]/);

      if (!functionMatch) {
        console.warn('Could not parse function from question:', questionText);
        return null;
      }

      const problem: Problem = {
        id: moodleQuestion.slot || 0,
        functionExpression: functionMatch[1],
        domain: domainMatch ? [parseFloat(domainMatch[1]), parseFloat(domainMatch[2])] : [-3, 3],
        point: pointMatch ? parseFloat(pointMatch[1]) : 1,
        questionType: questionText.includes('inverse') ? 'inverse_derivative' : 'derivative',
        moodleQuestionId: moodleQuestion.id,
      };

      return problem;
    } catch (error) {
      console.error('Error parsing Moodle question:', error);
      return null;
    }
  }

  /**
   * Submit grade to Moodle
   */
  async submitGrade(userId: number, quizId: number, grade: number): Promise<boolean> {
    try {
      await this.callMoodleWS('mod_quiz_save_attempt', {
        attemptid: quizId,
        userid: userId,
        grade: grade,
      });

      console.log(`Grade ${grade} submitted for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to submit grade:', error);
      return false;
    }
  }

  /**
   * Get course information
   */
  async getCourseInfo(courseId: number): Promise<any> {
    try {
      const data = await this.callMoodleWS('core_course_get_courses', {
        options: { ids: [courseId] },
      });

      return data[0] || null;
    } catch (error) {
      console.error('Failed to get course info:', error);
      return null;
    }
  }

  /**
   * Check if Moodle connection is working
   */
  async testConnection(): Promise<boolean> {
    try {
      const data = await this.callMoodleWS('core_webservice_get_site_info');
      console.log('✅ Moodle connection successful:', data.sitename);
      return true;
    } catch (error) {
      console.error('❌ Moodle connection failed');
      return false;
    }
  }
}

export default new MoodleService();
