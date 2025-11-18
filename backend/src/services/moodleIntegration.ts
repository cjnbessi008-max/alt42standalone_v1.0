import type { Question, MoodleQuestion } from '../../../shared/types.js';

/**
 * Moodle LMS Integration Service
 * Connects to Moodle 3.7 REST API to fetch questions
 *
 * Requirements:
 * - PHP 7.1.9
 * - MySQL 5.7
 * - Moodle 3.7
 *
 * @see https://docs.moodle.org/dev/Web_services
 */

interface MoodleConfig {
  url: string;
  token: string;
}

/**
 * Fetch questions from Moodle course
 */
export async function fetchQuestionsFromMoodle(
  config: MoodleConfig,
  courseId: number
): Promise<Question[]> {
  const endpoint = `${config.url}/webservice/rest/server.php`;

  const params = new URLSearchParams({
    wstoken: config.token,
    wsfunction: 'mod_quiz_get_quizzes_by_courses',
    moodlewsrestformat: 'json',
    courseids: [courseId.toString()],
  });

  try {
    const response = await fetch(`${endpoint}?${params}`);
    const data = await response.json();

    if (data.exception) {
      throw new Error(`Moodle API Error: ${data.message}`);
    }

    // Transform Moodle questions to our format
    return transformMoodleQuestions(data.quizzes);
  } catch (error) {
    console.error('Failed to fetch from Moodle:', error);
    throw error;
  }
}

/**
 * Transform Moodle question format to our internal format
 */
function transformMoodleQuestions(moodleQuestions: any[]): Question[] {
  return moodleQuestions.map((mq: any) => ({
    id: `moodle_${mq.id}`,
    title: mq.name,
    content: stripHtml(mq.intro || ''),
    type: mapMoodleQuestionType(mq.qtype),
    difficulty: 'medium', // Default, can be inferred from question
    metadata: {
      subject: mq.course || 'unknown',
      lmsId: mq.id.toString(),
      lmsSource: 'moodle',
      tags: []
    },
    createdAt: new Date(mq.timemodified * 1000).toISOString(),
    updatedAt: new Date(mq.timemodified * 1000).toISOString()
  }));
}

/**
 * Map Moodle question types to our types
 */
function mapMoodleQuestionType(moodleType: string): Question['type'] {
  const typeMap: Record<string, Question['type']> = {
    'multichoice': 'multiple_choice',
    'shortanswer': 'short_answer',
    'numerical': 'numerical',
    'calculated': 'mathematical_expression',
    'essay': 'short_answer',
  };

  return typeMap[moodleType] || 'short_answer';
}

/**
 * Strip HTML tags from Moodle content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Get Moodle configuration from environment
 */
export function getMoodleConfig(): MoodleConfig {
  const url = process.env.MOODLE_URL;
  const token = process.env.MOODLE_TOKEN;

  if (!url || !token) {
    throw new Error('Moodle configuration missing. Set MOODLE_URL and MOODLE_TOKEN in .env');
  }

  return { url, token };
}
