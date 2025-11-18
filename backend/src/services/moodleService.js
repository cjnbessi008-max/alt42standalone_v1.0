const axios = require('axios');
require('dotenv').config();

/**
 * Moodle Web Service API 연동 서비스
 *
 * Moodle 설정 필요사항:
 * 1. 관리 → 플러그인 → 웹 서비스 → 관리 → 웹 서비스 활성화
 * 2. 외부 서비스 생성 및 함수 추가
 * 3. 토큰 생성
 *
 * 필요한 함수:
 * - core_enrol_get_enrolled_users
 * - core_course_get_courses
 * - mod_quiz_get_quizzes_by_courses
 * - core_completion_get_activities_completion_status
 * - report_log_get_log_records (커스텀 필요할 수 있음)
 */

class MoodleService {
  constructor() {
    this.baseUrl = process.env.MOODLE_URL || '';
    this.token = process.env.MOODLE_TOKEN || '';
    this.wsEndpoint = `${this.baseUrl}/webservice/rest/server.php`;
  }

  /**
   * Moodle API 호출
   * @param {string} wsfunction - 웹 서비스 함수 이름
   * @param {Object} params - 파라미터
   * @returns {Promise<any>} API 응답
   */
  async callMoodleAPI(wsfunction, params = {}) {
    try {
      const response = await axios.get(this.wsEndpoint, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params
        },
        timeout: 30000
      });

      // Moodle 에러 체크
      if (response.data && response.data.exception) {
        throw new Error(`Moodle API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API 호출 실패 (${wsfunction}):`, error.message);
      throw error;
    }
  }

  /**
   * 모든 코스 목록 가져오기
   * @returns {Promise<Array>} 코스 목록
   */
  async getCourses() {
    try {
      const courses = await this.callMoodleAPI('core_course_get_courses');
      return courses;
    } catch (error) {
      console.error('코스 목록 조회 실패:', error.message);
      return [];
    }
  }

  /**
   * 특정 코스의 등록된 사용자 가져오기
   * @param {number} courseId - 코스 ID
   * @returns {Promise<Array>} 사용자 목록
   */
  async getEnrolledUsers(courseId) {
    try {
      const users = await this.callMoodleAPI('core_enrol_get_enrolled_users', {
        courseid: courseId
      });
      return users;
    } catch (error) {
      console.error(`코스 ${courseId} 사용자 조회 실패:`, error.message);
      return [];
    }
  }

  /**
   * 사이트 정보 가져오기
   * @returns {Promise<Object>} 사이트 정보
   */
  async getSiteInfo() {
    try {
      const info = await this.callMoodleAPI('core_webservice_get_site_info');
      return info;
    } catch (error) {
      console.error('사이트 정보 조회 실패:', error.message);
      return null;
    }
  }

  /**
   * 로그 데이터 가져오기 (커스텀 웹 서비스 함수 필요)
   *
   * Moodle에는 표준 로그 조회 API가 없으므로,
   * 직접 커스텀 웹 서비스 함수를 만들거나
   * DB에 직접 접근해야 합니다.
   *
   * 이 함수는 커스텀 웹 서비스가 구현되었다고 가정합니다.
   * 함수 이름: local_logheat_get_logs
   *
   * @param {Object} options - 조회 옵션
   * @param {number} options.timefrom - 시작 시각 (Unix timestamp)
   * @param {number} options.timeto - 종료 시각 (Unix timestamp)
   * @param {number} options.userid - 사용자 ID (선택사항)
   * @param {number} options.courseid - 코스 ID (선택사항)
   * @returns {Promise<Array>} 로그 레코드
   */
  async getLogs(options = {}) {
    try {
      const {
        timefrom = Math.floor(Date.now() / 1000) - 3600, // 기본: 1시간 전
        timeto = Math.floor(Date.now() / 1000),
        userid = 0,
        courseid = 0
      } = options;

      // 커스텀 웹 서비스 함수 호출
      const logs = await this.callMoodleAPI('local_logheat_get_logs', {
        timefrom,
        timeto,
        userid,
        courseid
      });

      return logs;
    } catch (error) {
      console.error('로그 데이터 조회 실패:', error.message);

      // 커스텀 함수가 없는 경우 대체 방법 안내
      if (error.message.includes('Invalid parameter')) {
        console.warn(
          '⚠️  커스텀 로그 조회 함수가 없습니다.\n' +
          '   Moodle에 local_logheat_get_logs 함수를 구현하거나,\n' +
          '   MySQL 데이터베이스에 직접 접근하도록 설정하세요.\n' +
          '   테이블: mdl_logstore_standard_log'
        );
      }

      return [];
    }
  }

  /**
   * MySQL DB에서 직접 로그 가져오기 (대체 방법)
   *
   * 이 메서드는 별도의 MySQL 연결이 필요합니다.
   * backend/src/config/moodleDb.js 파일을 만들어서 사용하세요.
   *
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Array>} 로그 레코드
   */
  async getLogsFromDB(options = {}) {
    // 이 메서드는 moodleDb.js가 구현된 후 활성화됩니다
    console.warn('⚠️  MySQL 직접 연결이 필요합니다. moodleDb.js를 구현하세요.');
    return [];
  }

  /**
   * 연결 테스트
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async testConnection() {
    try {
      const info = await this.getSiteInfo();
      if (info && info.sitename) {
        console.log(`✅ Moodle 연결 성공: ${info.sitename}`);
        console.log(`   버전: ${info.release || 'Unknown'}`);
        console.log(`   사용자: ${info.fullname || 'Unknown'}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Moodle 연결 실패:', error.message);
      return false;
    }
  }
}

module.exports = new MoodleService();
