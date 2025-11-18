import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost/moodle';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';

// Moodle Web Services API 호출
const callMoodleWS = async (wsfunction, params = {}) => {
  try {
    const response = await axios.get(`${MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params,
      },
    });

    if (response.data.exception) {
      throw new Error(response.data.message || 'Moodle API Error');
    }

    return response.data;
  } catch (error) {
    console.error(`Moodle API Error (${wsfunction}):`, error.message);
    throw error;
  }
};

// 코스 내용 가져오기
export const getCourseContents = async (courseId) => {
  return await callMoodleWS('core_course_get_contents', { courseid: courseId });
};

// 활동 정보 가져오기
export const getActivities = async (courseId) => {
  const contents = await getCourseContents(courseId);
  const activities = [];

  contents.forEach((section) => {
    section.modules.forEach((module) => {
      activities.push({
        id: module.id,
        name: module.name,
        modulename: module.modname,
        courseId: courseId,
        availability: module.availability || null,
      });
    });
  });

  return activities;
};

// Availability JSON 파싱
export const parseAvailability = (availabilityJson) => {
  if (!availabilityJson) {
    return [];
  }

  try {
    const availability = typeof availabilityJson === 'string'
      ? JSON.parse(availabilityJson)
      : availabilityJson;

    const conditions = [];

    if (availability.c && Array.isArray(availability.c)) {
      availability.c.forEach((condition, index) => {
        const parsedCondition = parseCondition(condition, index);
        if (parsedCondition) {
          conditions.push(parsedCondition);
        }
      });
    }

    return conditions;
  } catch (error) {
    console.error('Availability 파싱 오류:', error);
    return [];
  }
};

// 개별 조건 파싱
const parseCondition = (condition, index) => {
  const id = `cond_${Date.now()}_${index}`;

  // 완료 조건
  if (condition.type === 'completion') {
    return {
      id,
      type: 'completion',
      description: `활동 완료 필요: ${condition.cm || 'ID ' + condition.cm}`,
      operator: condition.op || 'AND',
      value: condition.e ? '완료됨' : '완료 필요',
    };
  }

  // 성적 조건
  if (condition.type === 'grade') {
    return {
      id,
      type: 'grade',
      description: `성적 조건: ${condition.min || 0}% 이상`,
      operator: condition.op || 'AND',
      value: `최소 ${condition.min || 0}%`,
    };
  }

  // 날짜 조건
  if (condition.type === 'date') {
    const date = condition.t ? new Date(condition.t * 1000).toLocaleDateString('ko-KR') : '미정';
    return {
      id,
      type: 'date',
      description: `날짜 조건: ${condition.d === '>=' ? '이후' : '이전'} ${date}`,
      operator: condition.op || 'AND',
      value: date,
    };
  }

  // 그룹 조건
  if (condition.type === 'group') {
    return {
      id,
      type: 'group',
      description: `그룹 멤버십 필요`,
      operator: condition.op || 'AND',
      value: condition.id || '',
    };
  }

  // 사용자 프로필 조건
  if (condition.type === 'profile') {
    return {
      id,
      type: 'user',
      description: `사용자 프로필 조건: ${condition.sf || ''}`,
      operator: condition.op || 'AND',
      value: condition.v || '',
    };
  }

  // 기타 조건
  return {
    id,
    type: 'custom',
    description: `커스텀 조건: ${condition.type || '알 수 없음'}`,
    operator: condition.op || 'AND',
    value: JSON.stringify(condition),
  };
};

// 조건 복잡도 계산
export const calculateConditionComplexity = (conditions) => {
  let complexity = 0;
  let maxNesting = 0;

  const calculateNesting = (conds, depth = 0) => {
    maxNesting = Math.max(maxNesting, depth);
    conds.forEach((cond) => {
      complexity++;
      if (cond.nested && cond.nested.length > 0) {
        calculateNesting(cond.nested, depth + 1);
      }
    });
  };

  calculateNesting(conditions);

  return {
    totalConditions: complexity,
    maxNestingDepth: maxNesting,
    complexityScore: complexity + maxNesting * 2,
  };
};

// 연결 테스트
export const testMoodleConnection = async () => {
  try {
    const result = await callMoodleWS('core_webservice_get_site_info');
    return {
      success: true,
      sitename: result.sitename || 'Unknown',
      version: result.version || 'Unknown',
      username: result.username || 'Unknown',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
