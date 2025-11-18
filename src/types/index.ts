/**
 * Core types for Logic Flow Visualization System
 */

// Moodle Question Types
export interface MoodleQuestion {
  id: number;
  type: 'multichoice' | 'truefalse' | 'shortanswer' | 'numerical' | 'essay';
  name: string;
  questiontext: string;
  questiontextformat: number;
  generalfeedback?: string;
  defaultmark: number;
  penalty: number;
  qtype: string;
  length: number;
  stamp: string;
  version: string;
  hidden: number;
  timecreated: number;
  timemodified: number;
  createdby: number;
  modifiedby: number;
}

// Logic Flow Node Types
export interface LogicNode {
  id: string;
  type: 'condition' | 'conclusion' | 'action' | 'decision';
  label: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  data?: Record<string, any>;
}

// Logic Flow Edge/Connection
export interface LogicEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  label?: string;
  condition?: string;
  style?: {
    strokeWidth?: number;
    strokeColor?: string;
    strokeDasharray?: string;
  };
}

// Complete Logic Flow Graph
export interface LogicFlowGraph {
  nodes: LogicNode[];
  edges: LogicEdge[];
  metadata?: {
    title?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// Moodle API Configuration
export interface MoodleConfig {
  wstoken: string;
  domainname: string;
  wsfunc?: string;
  moodlewsrestformat?: 'json' | 'xml';
}

// Moodle API Response
export interface MoodleResponse<T = any> {
  data?: T;
  error?: {
    exception: string;
    errorcode: string;
    message: string;
  };
  warnings?: Array<{
    item: string;
    itemid: number;
    warningcode: string;
    message: string;
  }>;
}

// Quiz/Problem Data
export interface QuizProblem {
  id: number;
  questionId: number;
  question: MoodleQuestion;
  logicFlow?: LogicFlowGraph;
  order: number;
}

// Student Progress
export interface StudentProgress {
  studentId: number;
  questionId: number;
  attempts: number;
  lastAttempt?: Date;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

// Mobile Simulator Config
export interface MobileSimulatorConfig {
  deviceType: 'iphone' | 'android' | 'tablet';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  scale: number;
}

// Application State
export interface AppState {
  currentQuestion: QuizProblem | null;
  logicFlow: LogicFlowGraph | null;
  moodleConfig: MoodleConfig | null;
  isLoading: boolean;
  error: string | null;
}
