/**
 * KTM Math Planet - Pipeline Type Definitions
 */

import { PlanetNumber } from './planets';

export enum PipelineStage {
  WORLD_MODEL = 'world_model',
  RULES = 'rules',
  DATA = 'data',
  INPUT_STRATEGY = 'input_strategy',
  UI = 'ui',
  DEPLOYMENT = 'deployment'
}

export enum JobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface GenerationJob {
  id: string;
  moduleId: string;
  stage: PipelineStage;
  status: JobStatus;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  errorLog?: string;
  startedAt: string;
  completedAt?: string;
}

// Planet 1: World Model
export interface WorldModelRequest {
  teacherRequest: string;
  language: 'ko' | 'en';
  gradeLevel?: string;
  subject: string;
}

export interface ConceptNode {
  id: string;
  name: string;
  type: 'concept' | 'operation' | 'relationship';
  description?: string;
}

export interface ConceptRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  description?: string;
}

export interface WorldModel {
  concepts: ConceptNode[];
  relationships: ConceptRelationship[];
  operations: string[];
  learningObjectives: string[];
  clarificationQuestions?: string[];
}

// Planet 2: Rules
export enum RuleType {
  VALIDATION = 'validation',
  CALCULATION = 'calculation',
  PROGRESSION = 'progression',
  FEEDBACK = 'feedback'
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  description: string;
  complexity: number; // 0-100
  isOntology: boolean;
  code?: string;
  ontologyReference?: string;
  testCases?: TestCase[];
}

export interface TestCase {
  id: string;
  input: Record<string, any>;
  expectedOutput: any;
  passed?: boolean;
}

// Planet 3: Data
export interface DatabaseSchema {
  tables: TableSchema[];
  relationships: SchemaRelationship[];
  indexes: IndexDefinition[];
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  constraints: string[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  constraints?: string[];
}

export interface SchemaRelationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface DataGenerationStatus {
  realDataPercentage: number;
  pseudoDataPercentage: number;
  totalRecords: number;
  generatedRecords: number;
}

// Planet 4: Input Strategy
export enum InputMethod {
  MANUAL_FORM = 'manual_form',
  BEHAVIOR_TRACKING = 'behavior_tracking',
  INTERACTIVE_PROMPT = 'interactive_prompt',
  DRAG_DROP = 'drag_drop',
  VOICE_INPUT = 'voice_input'
}

export interface InputStrategy {
  dataPoint: string;
  recommendedMethod: InputMethod;
  alternativeMethods: InputMethod[];
  validationRules: ValidationRule[];
  reasoning: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  errorMessage: string;
}

// Planet 5: UI Generation
export interface UIComponent {
  id: string;
  name: string;
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
  isReused: boolean;
  generatedCode?: string;
}

export interface UIGenerationResult {
  components: UIComponent[];
  routes: RouteDefinition[];
  styles: Record<string, any>;
  accessibilityScore: number;
}

export interface RouteDefinition {
  path: string;
  component: string;
  title: string;
  protected: boolean;
}

// Planet 6: Deployment
export interface DeploymentChecklist {
  apiGenerated: boolean;
  testsPass: boolean;
  dockerBuilt: boolean;
  deployed: boolean;
  documentationGenerated: boolean;
}

export interface DeploymentStatus {
  checklist: DeploymentChecklist;
  deploymentUrl?: string;
  apiDocumentationUrl?: string;
  errors?: string[];
}

// WebSocket Events
export interface PipelineProgressEvent {
  moduleId: string;
  planetNumber: PlanetNumber;
  stage: PipelineStage;
  progress: number;
  message: string;
}

export interface PlanetCompletedEvent {
  moduleId: string;
  planetNumber: PlanetNumber;
  data: Record<string, any>;
}

export interface AIThinkingEvent {
  moduleId: string;
  planetNumber: PlanetNumber;
  message: string;
  isThinking: boolean;
}
