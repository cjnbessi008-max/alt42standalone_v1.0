/**
 * Moodle API Integration Service
 * Connects to Moodle 3.7 with MySQL 5.7 and PHP 7.1.9
 */

import axios, { AxiosInstance } from 'axios';
import { MoodleModule, MoodleQuestion, Term } from '@/types';

interface MoodleConfig {
  baseUrl: string;
  token: string;
  wsFunction?: string;
}

class MoodleService {
  private api: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      params: {
        wstoken: config.token,
        moodlewsrestformat: 'json',
      },
    });
  }

  /**
   * Fetch module data from Moodle
   */
  async getModule(moduleId: number): Promise<MoodleModule> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_quiz_get_quizzes_by_courses',
          courseid: moduleId,
        },
      });

      return this.transformMoodleResponse(response.data);
    } catch (error) {
      console.error('Error fetching Moodle module:', error);
      throw new Error('Failed to fetch module from Moodle');
    }
  }

  /**
   * Fetch questions from Moodle quiz
   */
  async getQuestions(quizId: number): Promise<MoodleQuestion[]> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_questions',
          quizid: quizId,
        },
      });

      return this.transformQuestions(response.data);
    } catch (error) {
      console.error('Error fetching Moodle questions:', error);
      throw new Error('Failed to fetch questions from Moodle');
    }
  }

  /**
   * Transform Moodle response to our format
   */
  private transformMoodleResponse(data: any): MoodleModule {
    return {
      id: data.id || 0,
      name: data.name || 'Untitled Module',
      description: data.intro || '',
      questions: [],
      terms: [],
    };
  }

  /**
   * Transform Moodle questions to our format
   */
  private transformQuestions(data: any): MoodleQuestion[] {
    if (!Array.isArray(data)) return [];

    return data.map((q: any) => ({
      id: q.id,
      questionText: q.questiontext || '',
      questionType: this.mapQuestionType(q.qtype),
      options: q.options || [],
      correctAnswer: q.rightanswer,
      points: q.defaultmark || 1,
      category: q.category,
    }));
  }

  /**
   * Map Moodle question type to our format
   */
  private mapQuestionType(qtype: string): MoodleQuestion['questionType'] {
    const typeMap: Record<string, MoodleQuestion['questionType']> = {
      multichoice: 'multiple_choice',
      truefalse: 'true_false',
      shortanswer: 'short_answer',
      essay: 'essay',
    };

    return typeMap[qtype] || 'short_answer';
  }

  /**
   * Convert questions to terms for display
   */
  questionsToTerms(questions: MoodleQuestion[]): Term[] {
    return questions.map((q, index) => ({
      id: `term-${q.id}`,
      title: `문제 ${index + 1}`,
      description: q.questionText,
      content: this.formatQuestionContent(q),
      order: index,
      metadata: {
        questionId: q.id,
        questionType: q.questionType,
        points: q.points,
      },
    }));
  }

  /**
   * Format question content for display
   */
  private formatQuestionContent(question: MoodleQuestion): string {
    let content = question.questionText;

    if (question.options && question.options.length > 0) {
      content += '\n\n선택지:\n';
      question.options.forEach((option, idx) => {
        content += `${idx + 1}. ${option}\n`;
      });
    }

    return content;
  }

  /**
   * Test connection to Moodle
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'core_webservice_get_site_info',
        },
      });

      return response.data && !response.data.exception;
    } catch (error) {
      console.error('Moodle connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const createMoodleService = (config: MoodleConfig): MoodleService => {
  return new MoodleService(config);
};

export default MoodleService;
