import dotenv from 'dotenv';

dotenv.config();

export const moodleConfig = {
  url: process.env.MOODLE_URL || '',
  token: process.env.MOODLE_TOKEN || '',
  service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
  timeout: parseInt(process.env.API_TIMEOUT || '30000'),
};

// Moodle Web Service endpoint
export const MOODLE_WS_ENDPOINT = `${moodleConfig.url}/webservice/rest/server.php`;

// Validate Moodle configuration
export function validateMoodleConfig(): boolean {
  if (!moodleConfig.url) {
    console.error('❌ MOODLE_URL is not configured');
    return false;
  }
  if (!moodleConfig.token) {
    console.error('❌ MOODLE_TOKEN is not configured');
    return false;
  }
  console.log('✅ Moodle configuration valid');
  return true;
}
