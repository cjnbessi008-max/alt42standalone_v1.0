/**
 * Moodle LMS Connector
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7과 연동
 */

const mysql = require('mysql2/promise');
const axios = require('axios');

class MoodleConnector {
  constructor(config) {
    this.config = {
      mysql: {
        host: config.mysql?.host || 'localhost',
        port: config.mysql?.port || 3306,
        user: config.mysql?.user || 'moodle',
        password: config.mysql?.password || '',
        database: config.mysql?.database || 'moodle',
        connectionLimit: 10
      },
      moodle: {
        baseUrl: config.moodle?.baseUrl || 'http://localhost',
        wsToken: config.moodle?.wsToken || '',
        wsFunction: 'core_webservice_get_site_info'
      }
    };

    this.pool = null;
  }

  /**
   * MySQL 연결 풀 초기화
   */
  async initializePool() {
    try {
      this.pool = mysql.createPool(this.config.mysql);
      console.log('✓ Moodle MySQL 연결 풀 초기화 완료');
      return true;
    } catch (error) {
      console.error('✗ MySQL 연결 실패:', error.message);
      throw error;
    }
  }

  /**
   * Moodle Web Services API 호출
   */
  async callMoodleAPI(wsFunction, params = {}) {
    try {
      const url = `${this.config.moodle.baseUrl}/webservice/rest/server.php`;
      const response = await axios.get(url, {
        params: {
          wstoken: this.config.moodle.wsToken,
          wsfunction: wsFunction,
          moodlewsrestformat: 'json',
          ...params
        }
      });

      if (response.data.exception) {
        throw new Error(`Moodle API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('✗ Moodle API 호출 실패:', error.message);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회 (Moodle DB)
   */
  async getUserInfo(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT id, username, firstname, lastname, email,
                suspended, deleted, timecreated, lastaccess
         FROM mdl_user
         WHERE id = ? AND deleted = 0`,
        [userId]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자의 현재 코스 조회
   */
  async getUserCourses(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT c.id, c.fullname, c.shortname, c.category,
                ue.timestart, ue.timeend, ue.timecreated
         FROM mdl_course c
         JOIN mdl_enrol e ON e.courseid = c.id
         JOIN mdl_user_enrolments ue ON ue.enrolid = e.id
         WHERE ue.userid = ? AND c.visible = 1
         ORDER BY c.sortorder`,
        [userId]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자의 활동 로그 조회 (최근 활동)
   */
  async getUserActivityLog(userId, limit = 50) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT id, eventname, component, action, target,
                objecttable, objectid, courseid, timecreated
         FROM mdl_logstore_standard_log
         WHERE userid = ?
         ORDER BY timecreated DESC
         LIMIT ?`,
        [userId, limit]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자의 학습 시간 통계 (세션 기반)
   */
  async getUserLearningTime(userId, startTime, endTime) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT
          COUNT(*) as activity_count,
          MIN(timecreated) as first_activity,
          MAX(timecreated) as last_activity,
          courseid
         FROM mdl_logstore_standard_log
         WHERE userid = ?
           AND timecreated BETWEEN ? AND ?
         GROUP BY courseid`,
        [userId, startTime, endTime]
      );

      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자 메타데이터 저장 (커스텀 필드)
   */
  async setUserMetadata(userId, fieldName, fieldValue) {
    const connection = await this.pool.getConnection();
    try {
      // 먼저 커스텀 필드가 존재하는지 확인
      const [fields] = await connection.query(
        `SELECT id FROM mdl_user_info_field WHERE shortname = ?`,
        [fieldName]
      );

      let fieldId;
      if (fields.length === 0) {
        // 필드가 없으면 생성
        const [result] = await connection.query(
          `INSERT INTO mdl_user_info_field
           (shortname, name, datatype, categoryid, visible, locked)
           VALUES (?, ?, 'text', 1, 1, 0)`,
          [fieldName, fieldName]
        );
        fieldId = result.insertId;
      } else {
        fieldId = fields[0].id;
      }

      // 데이터 저장 또는 업데이트
      await connection.query(
        `INSERT INTO mdl_user_info_data (userid, fieldid, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE data = ?`,
        [userId, fieldId, fieldValue, fieldValue]
      );

      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자 메타데이터 조회
   */
  async getUserMetadata(userId, fieldName) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.data
         FROM mdl_user_info_data d
         JOIN mdl_user_info_field f ON f.id = d.fieldid
         WHERE d.userid = ? AND f.shortname = ?`,
        [userId, fieldName]
      );

      return rows.length > 0 ? rows[0].data : null;
    } finally {
      connection.release();
    }
  }

  /**
   * 연결 종료
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✓ Moodle MySQL 연결 풀 종료');
    }
  }

  /**
   * 연결 상태 확인
   */
  async healthCheck() {
    try {
      // MySQL 연결 확인
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      // Moodle API 연결 확인
      const siteInfo = await this.callMoodleAPI('core_webservice_get_site_info');

      return {
        mysql: true,
        moodle: true,
        siteInfo: {
          sitename: siteInfo.sitename,
          release: siteInfo.release,
          version: siteInfo.version
        }
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

module.exports = MoodleConnector;
