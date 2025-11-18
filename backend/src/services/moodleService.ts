import axios, { AxiosInstance } from 'axios';
import { MoodleQuestion, ParsedProblem } from '../types';

export class MoodleService {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.MOODLE_URL || '';
    this.token = process.env.MOODLE_TOKEN || '';

    this.client = axios.create({
      baseURL: `${this.baseUrl}/webservice/rest/server.php`,
      params: {
        wstoken: this.token,
        moodlewsrestformat: 'json',
      },
    });
  }

  /**
   * Fetch question by ID from Moodle
   */
  async getQuestion(questionId: number): Promise<MoodleQuestion | null> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_question_get_questions',
          questionids: [questionId],
        },
      });

      if (response.data && response.data.questions && response.data.questions.length > 0) {
        return response.data.questions[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching question from Moodle:', error);
      throw new Error('Failed to fetch question from Moodle');
    }
  }

  /**
   * Get questions from a quiz
   */
  async getQuizQuestions(quizId: number): Promise<MoodleQuestion[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_questions',
          quizid: quizId,
        },
      });

      return response.data.questions || [];
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      throw new Error('Failed to fetch quiz questions');
    }
  }

  /**
   * Parse Moodle question to structured format
   */
  parseQuestion(moodleQuestion: MoodleQuestion): ParsedProblem {
    // Extract plain text from HTML
    const plainText = this.stripHtml(moodleQuestion.questiontext);

    // Extract LaTeX equations (common patterns: $$...$$ or \[...\] or \(...\))
    const equations = this.extractEquations(moodleQuestion.questiontext);

    // Parse choices if multiple choice
    const choices = moodleQuestion.answers?.map(answer => ({
      id: answer.id,
      text: this.stripHtml(answer.answer),
      isCorrect: answer.fraction > 0,
    }));

    return {
      id: moodleQuestion.id,
      type: moodleQuestion.qtype,
      questionText: moodleQuestion.questiontext,
      plainText,
      equations,
      choices,
      metadata: {
        difficulty: undefined, // Can be extended with Moodle custom fields
        category: undefined,
        tags: [],
      },
    };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Extract LaTeX equations from text
   */
  private extractEquations(text: string): string[] {
    const equations: string[] = [];

    // Match $$...$$ (display math)
    const displayMath = text.match(/\$\$([^$]+)\$\$/g);
    if (displayMath) {
      equations.push(...displayMath.map(eq => eq.replace(/\$\$/g, '').trim()));
    }

    // Match $...$ (inline math)
    const inlineMath = text.match(/\$([^$]+)\$/g);
    if (inlineMath) {
      equations.push(...inlineMath.map(eq => eq.replace(/\$/g, '').trim()));
    }

    // Match \[...\] (display math)
    const bracketDisplayMath = text.match(/\\\[([^\]]+)\\\]/g);
    if (bracketDisplayMath) {
      equations.push(...bracketDisplayMath.map(eq => eq.replace(/\\\[|\\\]/g, '').trim()));
    }

    // Match \(...\) (inline math)
    const parenInlineMath = text.match(/\\\(([^)]+)\\\)/g);
    if (parenInlineMath) {
      equations.push(...parenInlineMath.map(eq => eq.replace(/\\\(|\\\)/g, '').trim()));
    }

    return [...new Set(equations)]; // Remove duplicates
  }

  /**
   * Test Moodle connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_webservice_get_site_info',
        },
      });

      return response.data && response.data.sitename !== undefined;
    } catch (error) {
      console.error('Moodle connection test failed:', error);
      return false;
    }
  }
}
