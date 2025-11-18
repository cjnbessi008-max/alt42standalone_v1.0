/**
 * In-memory data store for confusion tracking
 * In production, this would be replaced with a database
 */

import { v4 as uuidv4 } from 'uuid';
import {
  StudentConfusionState,
  ConceptConfusion,
  BehaviorMetrics,
  ConfusionDataPoint,
} from '../types/confusion.js';

// In-memory storage
const studentStates = new Map<string, StudentConfusionState>();
const confusionHistory = new Map<string, ConfusionDataPoint[]>();

/**
 * Calculate confusion level from metrics
 */
function calculateConfusionLevel(metrics: BehaviorMetrics): number {
  const weights = {
    timeSpent: 0.25,
    attemptCount: 0.20,
    incorrectness: 0.20,
    hesitation: 0.15,
    helpRequests: 0.10,
    mouseMovement: 0.05,
    inputChanges: 0.05,
  };

  const normalizeTimeSpent = Math.min(1, Math.max(0, (metrics.timeSpent - 60) / 240));
  const normalizeAttempts = Math.min(1, Math.max(0, (metrics.attemptCount - 1) / 4));
  const normalizeHesitation = Math.min(1, Math.max(0, (metrics.hesitationTime - 5) / 25));
  const normalizeHelpRequests = Math.min(1, Math.max(0, metrics.helpRequestCount / 3));
  const normalizeMouseMovement = Math.min(1, Math.max(0, (metrics.mouseMovementScore - 20) / 80));
  const normalizeInputChanges = Math.min(1, Math.max(0, (metrics.inputChangeCount - 2) / 8));
  const incorrectnessScore = metrics.isCorrect ? 0 : 1;

  const confusionScore =
    normalizeTimeSpent * weights.timeSpent +
    normalizeAttempts * weights.attemptCount +
    incorrectnessScore * weights.incorrectness +
    normalizeHesitation * weights.hesitation +
    normalizeHelpRequests * weights.helpRequests +
    normalizeMouseMovement * weights.mouseMovement +
    normalizeInputChanges * weights.inputChanges;

  return Math.min(100, Math.max(0, Math.round(confusionScore * 100)));
}

/**
 * Categorize confusion level
 */
function categorizeConfusion(level: number): string {
  if (level <= 20) return 'VERY_LOW';
  if (level <= 40) return 'LOW';
  if (level <= 60) return 'MEDIUM';
  if (level <= 80) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Get color for confusion category
 */
function getConfusionColor(category: string): string {
  const colorMap: Record<string, string> = {
    VERY_LOW: '#22c55e',
    LOW: '#84cc16',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    VERY_HIGH: '#ef4444',
  };
  return colorMap[category] || '#eab308';
}

/**
 * Get or create student state
 */
export function getStudentState(studentId: string, moduleId: string): StudentConfusionState {
  const key = `${studentId}-${moduleId}`;

  if (!studentStates.has(key)) {
    // Create initial state with mock data
    const initialState: StudentConfusionState = {
      studentId,
      studentName: `학생 ${studentId}`,
      moduleId,
      overallConfusion: 35,
      conceptConfusion: [
        {
          conceptId: 'concept-001',
          conceptName: '분수의 덧셈',
          confusionLevel: 25,
          category: 'LOW',
          color: '#84cc16',
          metrics: {
            timeSpent: 45,
            attemptCount: 2,
            isCorrect: true,
            hesitationTime: 8,
            helpRequestCount: 0,
            mouseMovementScore: 25,
            inputChangeCount: 3,
            timestamp: new Date(),
          },
          history: [],
        },
        {
          conceptId: 'concept-002',
          conceptName: '분수의 뺄셈',
          confusionLevel: 55,
          category: 'MEDIUM',
          color: '#eab308',
          metrics: {
            timeSpent: 120,
            attemptCount: 3,
            isCorrect: false,
            hesitationTime: 15,
            helpRequestCount: 1,
            mouseMovementScore: 45,
            inputChangeCount: 7,
            timestamp: new Date(),
          },
          history: [],
        },
        {
          conceptId: 'concept-003',
          conceptName: '분수의 곱셈',
          confusionLevel: 15,
          category: 'VERY_LOW',
          color: '#22c55e',
          metrics: {
            timeSpent: 30,
            attemptCount: 1,
            isCorrect: true,
            hesitationTime: 3,
            helpRequestCount: 0,
            mouseMovementScore: 18,
            inputChangeCount: 1,
            timestamp: new Date(),
          },
          history: [],
        },
      ],
      confusionHistory: generateMockHistory(),
      lastUpdated: new Date(),
      needsIntervention: false,
    };

    studentStates.set(key, initialState);
  }

  return studentStates.get(key)!;
}

/**
 * Update student confusion with new metrics
 */
export function updateStudentConfusion(
  studentId: string,
  conceptId: string,
  metrics: BehaviorMetrics
): StudentConfusionState {
  const moduleId = 'module-fractions-01'; // In production, this would be dynamic
  const state = getStudentState(studentId, moduleId);

  const confusionLevel = calculateConfusionLevel(metrics);
  const category = categorizeConfusion(confusionLevel);
  const color = getConfusionColor(category);

  // Find or create concept
  let concept = state.conceptConfusion.find((c) => c.conceptId === conceptId);

  if (concept) {
    // Update existing concept
    concept.confusionLevel = confusionLevel;
    concept.category = category;
    concept.color = color;
    concept.metrics = metrics;
    concept.history.push({
      timestamp: new Date(),
      confusionLevel,
      category,
      conceptId,
    });
  } else {
    // Add new concept
    concept = {
      conceptId,
      conceptName: `개념 ${conceptId}`,
      confusionLevel,
      category,
      color,
      metrics,
      history: [{
        timestamp: new Date(),
        confusionLevel,
        category,
        conceptId,
      }],
    };
    state.conceptConfusion.push(concept);
  }

  // Update overall confusion (average of all concepts)
  const totalConfusion = state.conceptConfusion.reduce(
    (sum, c) => sum + c.confusionLevel,
    0
  );
  state.overallConfusion = Math.round(totalConfusion / state.conceptConfusion.length);

  // Add to history
  state.confusionHistory.push({
    timestamp: new Date(),
    confusionLevel: state.overallConfusion,
    category: categorizeConfusion(state.overallConfusion),
    conceptId,
  });

  // Check if intervention needed
  state.needsIntervention = state.overallConfusion >= 70;
  state.lastUpdated = new Date();

  return state;
}

/**
 * Generate mock historical data
 */
function generateMockHistory(): ConfusionDataPoint[] {
  const history: ConfusionDataPoint[] = [];
  const now = new Date();

  for (let i = 10; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
    const baseLevel = 40;
    const variation = Math.sin(i * 0.5) * 20;
    const confusionLevel = Math.max(0, Math.min(100, baseLevel + variation));

    history.push({
      timestamp,
      confusionLevel: Math.round(confusionLevel),
      category: categorizeConfusion(confusionLevel),
      conceptId: `concept-${String(i % 3 + 1).padStart(3, '0')}`,
    });
  }

  return history;
}

export const confusionStore = {
  getStudentState,
  updateStudentConfusion,
};
