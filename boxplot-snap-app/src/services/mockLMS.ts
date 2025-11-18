// Mock LMS API - 추후 Moodle/실제 LMS와 연동 가능
export interface ProblemData {
  id: string;
  title: string;
  description: string;
  boxplotData: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    label: string;
  };
  studentScores?: number[];
}

// Moodle 연동을 위한 Mock 데이터
export const mockLMSData: ProblemData[] = [
  {
    id: '1',
    title: '수학 시험 점수 분포',
    description: '1학년 수학 중간고사 점수 분포를 나타냅니다.',
    boxplotData: {
      min: 45,
      q1: 68,
      median: 78,
      q3: 88,
      max: 98,
      label: '수학 점수'
    },
    studentScores: [45, 55, 60, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95, 98]
  },
  {
    id: '2',
    title: '영어 시험 점수 분포',
    description: '1학년 영어 중간고사 점수 분포를 나타냅니다.',
    boxplotData: {
      min: 50,
      q1: 72,
      median: 82,
      q3: 90,
      max: 100,
      label: '영어 점수'
    },
    studentScores: [50, 58, 65, 70, 72, 75, 78, 80, 82, 85, 87, 90, 92, 95, 97, 100]
  },
  {
    id: '3',
    title: '과학 시험 점수 분포',
    description: '1학년 과학 중간고사 점수 분포를 나타냅니다.',
    boxplotData: {
      min: 40,
      q1: 65,
      median: 75,
      q3: 85,
      max: 95,
      label: '과학 점수'
    },
    studentScores: [40, 48, 55, 60, 65, 68, 72, 75, 78, 82, 85, 88, 90, 92, 95]
  }
];

// LMS API 시뮬레이션
export class MockLMSService {
  // 문제 정보 가져오기
  static async getProblem(problemId: string): Promise<ProblemData | null> {
    // 실제 API 호출 시뮬레이션 (지연 추가)
    await new Promise(resolve => setTimeout(resolve, 500));

    const problem = mockLMSData.find(p => p.id === problemId);
    return problem || null;
  }

  // 모든 문제 가져오기
  static async getAllProblems(): Promise<ProblemData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockLMSData;
  }

  // Moodle 연동 시뮬레이션
  static async connectToMoodle(config: {
    url: string;
    token: string;
  }): Promise<boolean> {
    console.log('Connecting to Moodle...', config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  // 학생 답안 제출
  static async submitAnswer(
    _problemId: string,
    _studentId: string,
    _answer: any
  ): Promise<{ success: boolean; score?: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      score: Math.floor(Math.random() * 100)
    };
  }
}

// PHP Moodle API 연동을 위한 헬퍼 함수
export const MoodleAPIHelper = {
  // Moodle REST API 호출 예시
  async callMoodleAPI(
    endpoint: string,
    params: Record<string, any>,
    moodleUrl: string = 'https://your-moodle-site.com',
    token: string = 'your-moodle-token'
  ) {
    const url = new URL(`${moodleUrl}/webservice/rest/server.php`);
    url.searchParams.append('wstoken', token);
    url.searchParams.append('wsfunction', endpoint);
    url.searchParams.append('moodlewsrestformat', 'json');

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    try {
      const response = await fetch(url.toString());
      return await response.json();
    } catch (error) {
      console.error('Moodle API Error:', error);
      throw error;
    }
  },

  // 퀴즈 정보 가져오기
  async getQuizData(quizId: number) {
    return this.callMoodleAPI('mod_quiz_get_quiz_by_courses', {
      courseids: [quizId]
    });
  },

  // 학생 성적 가져오기
  async getGrades(courseId: number) {
    return this.callMoodleAPI('gradereport_user_get_grade_items', {
      courseid: courseId
    });
  }
};
