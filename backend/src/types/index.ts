// Core Types for Counterexample Shadow

export type PropositionType = 'universal' | 'existential' | 'conditional' | 'biconditional';

export type VisualizationMode = 'venn' | 'number-line' | 'graph' | 'custom';

export interface Proposition {
  id: string;
  title: string;
  statement: string;
  domain: string;
  type: PropositionType;
  truthValue: boolean | null;
  visualConfig: VisualizationConfig;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Counterexample {
  id: string;
  propositionId: string;
  value: any;
  explanation: string;
  visualPosition: { x: number; y: number };
  shadowIntensity: number;
  createdAt: Date;
}

export interface VisualizationConfig {
  mode: VisualizationMode;
  colors: {
    positive: string;
    negative: string;
    neutral: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
  lmsId?: string;
  createdAt: Date;
}

export interface StudentInteraction {
  id: string;
  userId: string;
  propositionId: string;
  interactionType: 'view' | 'attempt' | 'correct' | 'incorrect';
  data: any;
  createdAt: Date;
}

// API Request/Response types
export interface CreatePropositionRequest {
  title: string;
  statement: string;
  domain: string;
  type: PropositionType;
  truthValue?: boolean;
  visualConfig?: Partial<VisualizationConfig>;
}

export interface UpdatePropositionRequest extends Partial<CreatePropositionRequest> {}

export interface CreateCounterexampleRequest {
  value: any;
  explanation: string;
  visualPosition?: { x: number; y: number };
  shadowIntensity?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'teacher' | 'student';
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// LMS Integration
export interface LMSImportRequest {
  lmsType: 'moodle' | 'canvas';
  courseId: string;
  activityId: string;
  credentials?: {
    token?: string;
    apiKey?: string;
  };
}

export interface LMSExportRequest {
  userId: string;
  propositionId: string;
  score: number;
  maxScore: number;
  completed: boolean;
}
