import axios, { AxiosInstance } from 'axios';
import { MoodleActivityLog, MoodleConfig } from '../types';

/**
 * Moodle API Service
 * Handles communication with Moodle 3.7 LMS
 */
class MoodleApiService {
  private client: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch activity logs from Moodle
   * @param userid - User ID in Moodle
   * @param courseid - Course ID (optional)
   * @returns Promise with activity logs
   */
  async fetchActivityLogs(
    userid: number,
    courseid?: number
  ): Promise<MoodleActivityLog[]> {
    try {
      const params: Record<string, string | number> = {
        wstoken: this.config.wsToken || '',
        wsfunction: this.config.wsFunction || 'core_user_get_course_user_profiles',
        moodlewsrestformat: 'json',
        userid,
      };

      if (courseid) {
        params.courseid = courseid;
      }

      const response = await this.client.get('/webservice/rest/server.php', {
        params,
      });

      return this.transformToActivityLogs(response.data);
    } catch (error) {
      console.error('Error fetching Moodle activity logs:', error);
      throw error;
    }
  }

  /**
   * Transform Moodle response to ActivityLog format
   */
  private transformToActivityLogs(data: unknown): MoodleActivityLog[] {
    // This is a placeholder transformation
    // Actual implementation depends on Moodle API response structure
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.id || index,
        userid: item.userid || 0,
        courseid: item.courseid || 0,
        activityname: item.activityname || item.name || 'Unknown Activity',
        timestamp: item.timestamp || item.timecreated || Date.now(),
        score: item.score || item.grade,
        duration: item.duration || item.timespent,
      }));
    }
    return [];
  }

  /**
   * Generate mock data for development/testing
   */
  static generateMockData(count: number = 30): MoodleActivityLog[] {
    const activities = [
      'Quiz Attempt',
      'Forum Post',
      'Assignment Submit',
      'Video Watch',
      'Reading Material',
      'Practice Exercise',
    ];

    const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      userid: 123,
      courseid: 456,
      activityname: activities[Math.floor(Math.random() * activities.length)],
      timestamp: baseTime + i * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000,
      score: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 3600), // seconds
    }));
  }
}

export default MoodleApiService;
