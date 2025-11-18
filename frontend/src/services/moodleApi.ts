/**
 * Moodle LMS Integration API Client
 *
 * Provides TypeScript interfaces and API calls for Moodle integration
 */

import axios, { AxiosInstance } from 'axios';

// Base URL from environment or default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ComplexityMetrics {
  condition_count: number;
  nesting_depth: number;
  entity_count: number;
  has_cyclical_dependencies: boolean;
}

export interface ComplexityAssessment {
  metrics: ComplexityMetrics;
  level: 'simple' | 'moderate' | 'complex' | 'very_complex';
  requires_focus_card: boolean;
  recommendations: string[];
  focus_message: string | null;
}

export interface MoodleQuestion {
  id: number;
  name: string;
  question_text: string;
  question_type: string;
  complexity_metrics: ComplexityMetrics;
  complexity_assessment: ComplexityAssessment;
}

export interface ProblemStructure {
  topic: string;
  operation: string;
  entities: string[];
  conditions: string[];
  solution_steps: string[];
  complexity_level: string;
}

export interface ReconstructedProblem {
  original_id: number;
  original_text: string;
  reconstructed_text: string;
  strategy: string;
  structure: ProblemStructure;
  complexity_metrics: ComplexityMetrics;
  complexity_assessment: ComplexityAssessment;
  variations: string[];
}

export interface BatchReconstructSummary {
  by_complexity: {
    simple: number;
    moderate: number;
    complex: number;
    very_complex: number;
  };
  by_topic: { [key: string]: number };
  by_operation: { [key: string]: number };
}

export interface BatchReconstructResponse {
  quiz_id: number;
  total_questions: number;
  reconstructed_problems: ReconstructedProblem[];
  summary: BatchReconstructSummary;
}

export type ReconstructionStrategy =
  | 'reverse_solution'
  | 'decompose_recompose'
  | 'complexity_variation'
  | 'pattern_extraction';

export interface MoodleConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
}

// ============================================================================
// API Client Class
// ============================================================================

class MoodleApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connection to Moodle LMS
   */
  async testConnection(): Promise<MoodleConnectionStatus> {
    try {
      const response = await this.client.get<MoodleConnectionStatus>(
        '/api/v1/moodle/test-connection'
      );
      return response.data;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.response?.data?.detail || 'Connection failed',
      };
    }
  }

  /**
   * Get all questions from a quiz with complexity analysis
   */
  async getQuizQuestions(
    quizId: number,
    language: 'ko' | 'en' = 'ko'
  ): Promise<MoodleQuestion[]> {
    const response = await this.client.get<MoodleQuestion[]>(
      `/api/v1/moodle/quiz/${quizId}/questions`,
      { params: { language } }
    );
    return response.data;
  }

  /**
   * Get a single question with complexity analysis
   */
  async getQuestion(
    questionId: number,
    language: 'ko' | 'en' = 'ko'
  ): Promise<MoodleQuestion> {
    const response = await this.client.get<MoodleQuestion>(
      `/api/v1/moodle/question/${questionId}`,
      { params: { language } }
    );
    return response.data;
  }

  /**
   * Reconstruct a single problem using specified strategy
   */
  async reconstructProblem(
    questionId: number,
    strategy: ReconstructionStrategy = 'reverse_solution',
    language: 'ko' | 'en' = 'ko'
  ): Promise<ReconstructedProblem> {
    const response = await this.client.post<ReconstructedProblem>(
      '/api/v1/moodle/reconstruct',
      {
        question_id: questionId,
        strategy,
        language,
      }
    );
    return response.data;
  }

  /**
   * Batch reconstruct all problems in a quiz
   */
  async batchReconstructQuiz(
    quizId: number,
    strategy: ReconstructionStrategy = 'reverse_solution',
    language: 'ko' | 'en' = 'ko'
  ): Promise<BatchReconstructResponse> {
    const response = await this.client.post<BatchReconstructResponse>(
      '/api/v1/moodle/reconstruct/batch',
      {
        quiz_id: quizId,
        strategy,
        language,
      }
    );
    return response.data;
  }

  /**
   * Get API statistics
   */
  async getStatistics(): Promise<any> {
    const response = await this.client.get('/api/v1/statistics');
    return response.data;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const moodleApi = new MoodleApiClient();

// ============================================================================
// Strategy Descriptions
// ============================================================================

export const STRATEGY_INFO: Record<ReconstructionStrategy, { title: string; description: string; useCase: string }> = {
  reverse_solution: {
    title: '역순 풀이',
    description: '답에서 문제로 거꾸로 구성합니다',
    useCase: '문제 해결 역량 강화, 역공학적 사고 훈련',
  },
  decompose_recompose: {
    title: '분해 재조합',
    description: '문제를 구성요소로 분해하고 다시 조립합니다',
    useCase: '복잡한 문제 이해, 구조적 사고 개발',
  },
  complexity_variation: {
    title: '복잡도 변형',
    description: '쉬운/어려운 버전을 생성합니다',
    useCase: '적응형 학습, 단계별 난이도 조절',
  },
  pattern_extraction: {
    title: '패턴 추출',
    description: '문제 패턴을 추출하여 새로운 맥락에 적용합니다',
    useCase: '패턴 인식, 전이 학습',
  },
};

// ============================================================================
// Complexity Level Helpers
// ============================================================================

export function getComplexityColor(level: string): string {
  switch (level) {
    case 'simple':
      return '#10b981'; // green
    case 'moderate':
      return '#f59e0b'; // amber
    case 'complex':
      return '#f97316'; // orange
    case 'very_complex':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

export function getComplexityLabel(level: string): string {
  switch (level) {
    case 'simple':
      return '단순';
    case 'moderate':
      return '보통';
    case 'complex':
      return '복잡';
    case 'very_complex':
      return '매우 복잡';
    default:
      return '알 수 없음';
  }
}

export function getComplexityIcon(level: string): string {
  switch (level) {
    case 'simple':
      return '✓';
    case 'moderate':
      return '●';
    case 'complex':
      return '⚠';
    case 'very_complex':
      return '⚠⚠';
    default:
      return '?';
  }
}
