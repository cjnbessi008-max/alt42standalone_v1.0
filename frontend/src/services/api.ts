import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface Problem {
  id: string;
  title: string;
  description: string;
  function_expression: string;
  difficulty_level: number;
  category: string;
  created_at: string;
}

export interface TreeNode {
  id: string;
  type: 'operator' | 'function' | 'variable' | 'constant' | 'symbol';
  value: string;
  children: TreeNode[];
  depth: number;
  position: number;
  latex?: string;
  description?: string;
}

export interface FunctionTree {
  expression: string;
  root: TreeNode;
  nodeCount: number;
  maxDepth: number;
  variables: string[];
}

export interface ParseResponse {
  success: boolean;
  data: {
    tree: FunctionTree;
    d3Tree: any;
    treeId: string | null;
  };
}

// API Functions

/**
 * 모든 문제 조회
 */
export const getAllProblems = async (): Promise<Problem[]> => {
  const response = await api.get<{ success: boolean; data: Problem[] }>('/problems');
  return response.data.data;
};

/**
 * 특정 문제 조회
 */
export const getProblemById = async (id: string): Promise<Problem> => {
  const response = await api.get<{ success: boolean; data: Problem }>(`/problems/${id}`);
  return response.data.data;
};

/**
 * 난이도별 문제 조회
 */
export const getProblemsByDifficulty = async (level: number): Promise<Problem[]> => {
  const response = await api.get<{ success: boolean; data: Problem[] }>(
    `/problems?difficulty=${level}`
  );
  return response.data.data;
};

/**
 * 카테고리별 문제 조회
 */
export const getProblemsByCategory = async (category: string): Promise<Problem[]> => {
  const response = await api.get<{ success: boolean; data: Problem[] }>(
    `/problems?category=${category}`
  );
  return response.data.data;
};

/**
 * 함수 파싱
 */
export const parseFunction = async (
  expression: string,
  problemId?: string,
  save: boolean = false
): Promise<ParseResponse> => {
  const response = await api.post<ParseResponse>('/functions/parse', {
    expression,
    problemId,
    save,
  });
  return response.data;
};

/**
 * 함수 유효성 검사
 */
export const validateFunction = async (expression: string): Promise<boolean> => {
  const response = await api.post<{ success: boolean; valid: boolean }>(
    '/functions/validate',
    { expression }
  );
  return response.data.valid;
};

export default api;
