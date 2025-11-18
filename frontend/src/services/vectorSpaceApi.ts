import axios, { AxiosInstance } from 'axios';
import type { VectorSpaceData, StudentLearningPath, Concept } from '@types/index';

/**
 * Vector Space API Service
 * 백엔드 API와 통신하여 벡터 공간 데이터 관리
 */
class VectorSpaceApiService {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 모듈의 Vector Space Map 데이터 가져오기
   */
  async getVectorSpace(moduleId: string): Promise<VectorSpaceData> {
    const response = await this.api.get<VectorSpaceData>(
      `/modules/${moduleId}/vector-space`
    );
    return response.data;
  }

  /**
   * 특정 개념의 상세 정보 및 관련 개념 가져오기
   */
  async getConceptDetails(moduleId: string, conceptId: string): Promise<{
    concept: Concept;
    relatedConcepts: Concept[];
    prerequisites: Concept[];
  }> {
    const response = await this.api.get(
      `/modules/${moduleId}/concepts/${conceptId}`
    );
    return response.data;
  }

  /**
   * Vector Space 재생성 요청
   */
  async regenerateVectorSpace(moduleId: string): Promise<{ taskId: string }> {
    const response = await this.api.post(
      `/modules/${moduleId}/vector-space/regenerate`
    );
    return response.data;
  }

  /**
   * 학생의 학습 경로 가져오기
   */
  async getStudentLearningPath(
    studentId: string,
    moduleId: string
  ): Promise<StudentLearningPath> {
    const response = await this.api.get<StudentLearningPath>(
      `/students/${studentId}/learning-path/${moduleId}`
    );
    return response.data;
  }

  /**
   * 학생의 개념 방문 기록
   */
  async recordConceptVisit(
    studentId: string,
    moduleId: string,
    conceptId: string,
    data: {
      timeSpent: number;
      masteryScore?: number;
    }
  ): Promise<void> {
    await this.api.post(`/students/${studentId}/learning-path/${moduleId}/visit`, {
      conceptId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Moodle 퀴즈 데이터로부터 Vector Space 생성
   */
  async generateFromMoodleQuiz(
    moduleId: string,
    quizId: number,
    moodleBaseUrl: string,
    wstoken: string
  ): Promise<{ taskId: string }> {
    const response = await this.api.post('/modules/generate-from-moodle', {
      moduleId,
      quizId,
      moodleBaseUrl,
      wstoken,
    });
    return response.data;
  }
}

// 싱글톤 인스턴스
const vectorSpaceApi = new VectorSpaceApiService();

export default vectorSpaceApi;
