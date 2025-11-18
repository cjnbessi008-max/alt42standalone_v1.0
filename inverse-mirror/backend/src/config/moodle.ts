import dotenv from 'dotenv';

dotenv.config();

export const moodleConfig = {
  baseUrl: process.env.MOODLE_BASE_URL || 'http://localhost/moodle',
  wsToken: process.env.MOODLE_WS_TOKEN || '',
  courseId: parseInt(process.env.MOODLE_COURSE_ID || '2'),

  // Moodle Web Services endpoints
  getEndpoint: (functionName: string) => {
    const base = process.env.MOODLE_BASE_URL || 'http://localhost/moodle';
    return `${base}/webservice/rest/server.php?wstoken=${process.env.MOODLE_WS_TOKEN}&wsfunction=${functionName}&moodlewsrestformat=json`;
  },
};

export default moodleConfig;
