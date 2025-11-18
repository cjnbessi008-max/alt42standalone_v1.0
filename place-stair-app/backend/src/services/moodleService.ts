import axios, { AxiosInstance } from 'axios';
import { PlaceStairProblem, MoodleApiResponse } from '../types';

class MoodleService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.MOODLE_URL || 'http://localhost/moodle';
    this.token = process.env.MOODLE_API_TOKEN || '';

    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/webservice/rest/server.php`,
      params: {
        wstoken: this.token,
        moodlewsrestformat: 'json'
      }
    });
  }

  /**
   * Fetch problem data from Moodle
   * This assumes a custom Moodle web service function exists
   */
  async getProblemsForStudent(studentId: number, courseId: number): Promise<MoodleApiResponse<PlaceStairProblem[]>> {
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'local_placeStair_get_problems',
          studentid: studentId,
          courseid: courseId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching problems from Moodle:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit student answer to Moodle
   */
  async submitAnswer(studentId: number, problemId: number, answer: any, isCorrect: boolean, timeSpent: number): Promise<MoodleApiResponse<any>> {
    try {
      const response = await this.axiosInstance.post('', null, {
        params: {
          wsfunction: 'local_placeStair_submit_answer',
          studentid: studentId,
          problemid: problemId,
          answer: JSON.stringify(answer),
          iscorrect: isCorrect ? 1 : 0,
          timespent: timeSpent
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error submitting answer to Moodle:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get student progress from Moodle
   */
  async getStudentProgress(studentId: number, courseId: number): Promise<MoodleApiResponse<any>> {
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'local_placeStair_get_progress',
          studentid: studentId,
          courseid: courseId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching student progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new MoodleService();
