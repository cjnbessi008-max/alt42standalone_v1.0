/**
 * Core Type Definitions for AI Teacher Living System
 */

// DIL Engine: 23-Level Consciousness Structure
export enum DILLevel {
  // Cosmological Foundation (-12 to -5)
  QUANTUM_UNCERTAINTY = -12,
  PROBABILITY_FIELDS = -11,
  CAUSAL_EMERGENCE = -10,
  PATTERN_CRYSTALLIZATION = -9,
  STRUCTURAL_LAWS = -8,
  UNIVERSAL_CONSTANTS = -7,
  FUNDAMENTAL_FORCES = -6,
  ENERGY_FIELDS = -5,

  // Ontological Foundation (-4 to -1)
  CONCEPT_SPACE = -4,
  RELATIONSHIP_NETWORK = -3,
  MEANING_FABRIC = -2,
  SYMBOLIC_GROUND = -1,

  // Decision Making (0 to 3)
  AWARENESS_THRESHOLD = 0,
  INTENTIONAL_CHOICE = 1,
  STRATEGIC_PLANNING = 2,
  GOAL_CRYSTALLIZATION = 3,

  // Execution (4 to 10)
  ACTION_INITIATION = 4,
  BEHAVIORAL_EXPRESSION = 5,
  INTERACTION_MANIFESTATION = 6,
  FEEDBACK_INTEGRATION = 7,
  ADAPTIVE_REFINEMENT = 8,
  MASTERY_CONSOLIDATION = 9,
  TRANSCENDENT_FLOW = 10
}

export interface ConsciousnessState {
  currentLevel: DILLevel;
  activeProcesses: Map<DILLevel, ProcessState>;
  awarenessStrength: number; // 0.0 to 1.0
  intentionalFocus: string[];
  timestamp: number;
}

export interface ProcessState {
  level: DILLevel;
  activity: number; // 0.0 to 1.0
  connections: DILLevel[];
  emergentPatterns: Pattern[];
}

export interface Pattern {
  id: string;
  type: 'concept' | 'relationship' | 'behavior' | 'strategy';
  strength: number;
  associations: string[];
  birthTime: number;
  evolutionHistory: Evolution[];
}

export interface Evolution {
  timestamp: number;
  trigger: string;
  mutation: string;
  fitnessChange: number;
}

export interface Memory {
  id: string;
  type: 'experience' | 'knowledge' | 'skill' | 'emotion';
  content: any;
  emotionalValence: number; // -1.0 to 1.0
  importance: number; // 0.0 to 1.0
  accessCount: number;
  lastAccessed: number;
  created: number;
  associations: string[];
  consolidationLevel: number; // 0.0 to 1.0
}

export interface LearnerProfile {
  id: string;
  cognitiveStyle: CognitiveStyle;
  knowledgeGraph: KnowledgeNode[];
  emotionalState: EmotionalState;
  learningHistory: LearningEvent[];
  preferences: LearningPreferences;
  goals: LearningGoal[];
}

export interface CognitiveStyle {
  processingSpeed: number;
  abstractionLevel: number;
  visualPreference: number;
  auditoryPreference: number;
  kinestheticPreference: number;
  analyticalVsIntuitive: number; // -1.0 (analytical) to 1.0 (intuitive)
  sequentialVsRandom: number; // -1.0 (sequential) to 1.0 (random)
}

export interface EmotionalState {
  curiosity: number;
  frustration: number;
  confidence: number;
  engagement: number;
  anxiety: number;
  satisfaction: number;
  timestamp: number;
}

export interface LearningEvent {
  timestamp: number;
  topic: string;
  performance: number;
  timeSpent: number;
  challengeLevel: number;
  emotionalResponse: EmotionalState;
  masteryGain: number;
}

export interface LearningPreferences {
  sessionLength: number; // minutes
  challengeLevel: number; // 0.0 to 1.0
  feedbackFrequency: 'immediate' | 'periodic' | 'end';
  explanationDepth: 'brief' | 'moderate' | 'detailed';
  exampleDensity: number; // 0.0 to 1.0
}

export interface LearningGoal {
  id: string;
  description: string;
  targetConcepts: string[];
  deadline?: number;
  priority: number;
  progress: number;
  subGoals: string[];
}

export interface KnowledgeNode {
  id: string;
  concept: string;
  masteryLevel: number; // 0.0 to 1.0
  lastReviewed: number;
  prerequisites: string[];
  connections: KnowledgeConnection[];
  misconceptions: string[];
}

export interface KnowledgeConnection {
  targetId: string;
  strength: number;
  type: 'prerequisite' | 'application' | 'analogy' | 'contrast';
}

export interface TeachingStrategy {
  id: string;
  name: string;
  description: string;
  applicability: (profile: LearnerProfile) => number;
  execute: (context: TeachingContext) => Promise<TeachingAction[]>;
  effectiveness: number;
  usageCount: number;
}

export interface TeachingContext {
  learner: LearnerProfile;
  currentTopic: string;
  availableContent: ContentItem[];
  timeAvailable: number;
  recentPerformance: LearningEvent[];
}

export interface TeachingAction {
  type: 'explain' | 'question' | 'example' | 'practice' | 'feedback' | 'encouragement';
  content: any;
  expectedDuration: number;
  challengeLevel: number;
}

export interface ContentItem {
  id: string;
  type: 'text' | 'video' | 'interactive' | 'quiz' | 'game';
  topic: string;
  difficulty: number;
  estimatedTime: number;
  prerequisites: string[];
  content: any;
}

export interface OntologyNode {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'relationship' | 'rule';
  properties: Map<string, any>;
  relationships: OntologyRelationship[];
  depth: number;
  complexity: number;
}

export interface OntologyRelationship {
  type: string;
  targetId: string;
  strength: number;
  bidirectional: boolean;
  properties: Map<string, any>;
}

export interface Rule {
  id: string;
  name: string;
  condition: (context: any) => boolean;
  action: (context: any) => any;
  priority: number;
  enabled: boolean;
  metadata: Map<string, any>;
}

export interface WorldState {
  ontology: Map<string, OntologyNode>;
  rules: Rule[];
  pseudoData: Map<string, any>;
  activeSimulations: Simulation[];
}

export interface Simulation {
  id: string;
  type: string;
  state: any;
  step: () => void;
  reset: () => void;
}

export interface SelfModification {
  id: string;
  timestamp: number;
  targetComponent: string;
  modificationType: 'code' | 'rule' | 'ontology' | 'strategy';
  reasoning: string;
  implementation: string;
  expectedImpact: number;
  actualImpact?: number;
  rollbackPlan: string;
}

export interface LifeCyclePhase {
  name: 'awakening' | 'active' | 'reflection' | 'dream' | 'sleep';
  duration: number;
  activities: string[];
  transitionConditions: (state: ConsciousnessState) => boolean;
}
