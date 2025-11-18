const axios = require('axios');
const config = require('../config');

class MoodleService {
  constructor() {
    this.baseUrl = config.moodle.url;
    this.token = config.moodle.token;
    this.wsFormat = config.moodle.wsFormat;
  }

  /**
   * Moodle Web Service API 호출
   * @param {string} wsfunction - Web service 함수명
   * @param {object} params - 추가 파라미터
   * @returns {Promise<object>} API 응답
   */
  async callMoodleAPI(wsfunction, params = {}) {
    try {
      const url = `${this.baseUrl}/webservice/rest/server.php`;

      const response = await axios.get(url, {
        params: {
          wstoken: this.token,
          wsfunction: wsfunction,
          moodlewsrestformat: this.wsFormat,
          ...params
        }
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error');
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API Error (${wsfunction}):`, error.message);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   * @param {number} userId - Moodle 사용자 ID
   * @returns {Promise<object>} 사용자 정보
   */
  async getUserInfo(userId) {
    const data = await this.callMoodleAPI('core_user_get_users', {
      'criteria[0][key]': 'id',
      'criteria[0][value]': userId
    });

    return data.users && data.users[0] ? data.users[0] : null;
  }

  /**
   * 사용자의 전체 성적 조회
   * @param {number} userId - Moodle 사용자 ID
   * @param {number} courseId - 코스 ID
   * @returns {Promise<object>} 성적 정보
   */
  async getUserGrades(userId, courseId) {
    try {
      const data = await this.callMoodleAPI('gradereport_user_get_grade_items', {
        userid: userId,
        courseid: courseId
      });

      return this.processGradeData(data);
    } catch (error) {
      console.error('Error fetching user grades:', error.message);
      return null;
    }
  }

  /**
   * 퀴즈 시도 정보 조회
   * @param {number} quizId - 퀴즈 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Array>} 퀴즈 시도 목록
   */
  async getQuizAttempts(quizId, userId) {
    try {
      const data = await this.callMoodleAPI('mod_quiz_get_user_attempts', {
        quizid: quizId,
        userid: userId
      });

      return data.attempts || [];
    } catch (error) {
      console.error('Error fetching quiz attempts:', error.message);
      return [];
    }
  }

  /**
   * 코스의 모든 퀴즈 조회
   * @param {number} courseId - 코스 ID
   * @returns {Promise<Array>} 퀴즈 목록
   */
  async getCourseQuizzes(courseId) {
    try {
      const data = await this.callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
        'courseids[0]': courseId
      });

      return data.quizzes || [];
    } catch (error) {
      console.error('Error fetching course quizzes:', error.message);
      return [];
    }
  }

  /**
   * 성적 데이터를 타워에 표시할 형태로 가공
   * @param {object} gradeData - Moodle 성적 데이터
   * @returns {object} 가공된 데이터
   */
  processGradeData(gradeData) {
    if (!gradeData || !gradeData.usergrades || gradeData.usergrades.length === 0) {
      return {
        totalScore: 0,
        maxScore: 100,
        percentage: 0,
        items: []
      };
    }

    const userGrade = gradeData.usergrades[0];
    const gradeItems = userGrade.gradeitems || [];

    let totalScore = 0;
    let maxScore = 0;
    const items = [];

    gradeItems.forEach(item => {
      if (item.gradedatesubmitted && item.graderaw !== undefined) {
        const score = parseFloat(item.graderaw) || 0;
        const max = parseFloat(item.grademax) || 0;

        totalScore += score;
        maxScore += max;

        items.push({
          name: item.itemname,
          score: score,
          maxScore: max,
          percentage: max > 0 ? (score / max) * 100 : 0,
          timestamp: item.gradedatesubmitted
        });
      }
    });

    return {
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0,
      items: items.sort((a, b) => a.timestamp - b.timestamp)
    };
  }

  /**
   * 학생의 누적 점수 조회 (타워 높이 계산용)
   * @param {number} userId - 사용자 ID
   * @param {number} courseId - 코스 ID
   * @returns {Promise<object>} 누적 점수 정보
   */
  async getAccumulationScore(userId, courseId) {
    const gradeData = await this.getUserGrades(userId, courseId);

    if (!gradeData) {
      return {
        userId,
        courseId,
        totalScore: 0,
        layers: [],
        height: 0
      };
    }

    // 각 항목을 타워의 층(layer)으로 변환
    const layers = gradeData.items.map((item, index) => ({
      id: index + 1,
      name: item.name,
      score: item.score,
      maxScore: item.maxScore,
      percentage: item.percentage,
      height: this.calculateLayerHeight(item.score, item.maxScore),
      color: this.getColorByPercentage(item.percentage),
      timestamp: item.timestamp
    }));

    return {
      userId,
      courseId,
      totalScore: gradeData.totalScore,
      totalPercentage: gradeData.percentage,
      layers,
      height: layers.reduce((sum, layer) => sum + layer.height, 0)
    };
  }

  /**
   * 점수에 따른 층 높이 계산
   * @param {number} score - 획득 점수
   * @param {number} maxScore - 최대 점수
   * @returns {number} 층 높이 (픽셀)
   */
  calculateLayerHeight(score, maxScore) {
    if (maxScore === 0) return 0;
    const baseHeight = 30; // 기본 높이
    const maxHeight = 100; // 최대 높이
    const percentage = score / maxScore;
    return Math.max(10, Math.min(maxHeight, baseHeight * percentage));
  }

  /**
   * 점수 비율에 따른 색상 반환
   * @param {number} percentage - 점수 비율 (0-100)
   * @returns {string} 색상 코드
   */
  getColorByPercentage(percentage) {
    if (percentage >= 90) return '#4CAF50'; // 녹색 - 우수
    if (percentage >= 70) return '#8BC34A'; // 연두색 - 양호
    if (percentage >= 50) return '#FFC107'; // 노란색 - 보통
    if (percentage >= 30) return '#FF9800'; // 주황색 - 미흡
    return '#F44336'; // 빨간색 - 부족
  }
}

module.exports = new MoodleService();
