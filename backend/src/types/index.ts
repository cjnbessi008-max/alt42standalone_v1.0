import { Request } from 'express';

// 함수 타입
export interface MathFunction {
  id: string;
  name: string;
  displayName: string;
  expression: string;
  type: string;
  color: string;
}

// 문제
export interface Problem {
  id: number;
  title: string;
  description: string;
  availableFunctions: string[];
  targetComposition: string;
  testCases: TestCase[];
  maxAttempts: number;
  timeLimit?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestCase {
  input: number;
  expectedOutput: number;
}

// 학생 시도
export interface Attempt {
  id?: number;
  problemId: number;
  studentId: string;
  studentName?: string;
  composition: CompositionBlock[];
  result: AttemptResult;
  timestamp: Date;
}

export interface CompositionBlock {
  id: string;
  functionId: string;
  position: number;
}

export interface AttemptResult {
  success: boolean;
  passedTests: number;
  totalTests: number;
  score: number;
}

// LTI
export interface LTISession {
  userId: string;
  userName: string;
  courseId: string;
  resourceLinkId: string;
  lisOutcomeServiceUrl?: string;
  lisResultSourcedId?: string;
}

export interface LTIRequest extends Request {
  body: {
    oauth_consumer_key?: string;
    oauth_signature_method?: string;
    oauth_timestamp?: string;
    oauth_nonce?: string;
    oauth_version?: string;
    oauth_signature?: string;
    user_id?: string;
    lis_person_name_full?: string;
    lis_person_name_given?: string;
    lis_person_name_family?: string;
    context_id?: string;
    context_title?: string;
    resource_link_id?: string;
    resource_link_title?: string;
    lis_outcome_service_url?: string;
    lis_result_sourcedid?: string;
    roles?: string;
    [key: string]: any;
  };
}

// 데이터베이스 모델
export interface ProblemRow {
  id: number;
  title: string;
  description: string;
  available_functions: string; // JSON
  target_composition: string;
  test_cases: string; // JSON
  max_attempts: number;
  time_limit: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface AttemptRow {
  id: number;
  problem_id: number;
  student_id: string;
  student_name: string | null;
  composition: string; // JSON
  result: string; // JSON
  created_at: Date;
}
