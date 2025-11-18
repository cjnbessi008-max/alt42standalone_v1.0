import { query } from '../db/connection';
import { createLogger } from '../utils/logger';
import NodeCache from 'node-cache';

const logger = createLogger();
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300') });

interface SessionContext {
  student_id: string;
  module_id?: string;
  problem_id?: string;
  problem_complexity: number;
  trigger_point: 'before' | 'after';
  session_context: {
    problems_attempted: number;
    problems_correct: number;
    active_time_minutes: number;
    time_since_last_rest?: number;
  };
}

interface Routine {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  type: string;
  complexity_level: number;
  instructions: any;
  media_url: string | null;
}

export class RecommendationEngine {
  /**
   * Calculate fatigue score based on session context
   */
  private calculateFatigue(context: SessionContext): number {
    const {
      problems_attempted,
      problems_correct,
      active_time_minutes,
      time_since_last_rest = 0
    } = context.session_context;

    // Time on task component (0-1 scale)
    const timeWeight = Math.min(active_time_minutes / 30, 1.0) * 0.4;

    // Error rate component (0-1 scale)
    const errorRate = problems_attempted > 0
      ? 1 - (problems_correct / problems_attempted)
      : 0;
    const errorWeight = errorRate * 0.3;

    // Time since last rest component (0-1 scale)
    const restWeight = Math.min(time_since_last_rest / 30, 1.0) * 0.3;

    const fatigueScore = timeWeight + errorWeight + restWeight;

    logger.debug('Fatigue calculated', {
      fatigueScore,
      timeWeight,
      errorWeight,
      restWeight,
      context
    });

    return Math.min(fatigueScore, 1.0);
  }

  /**
   * Determine duration range based on complexity and fatigue
   */
  private getDurationRange(complexity: number, fatigueScore: number): { min: number; max: number } {
    let minDuration = 30;
    let maxDuration = 120;

    // Adjust based on problem complexity
    if (complexity >= 4) {
      minDuration = 60;
      maxDuration = 180;
    }

    // Adjust based on fatigue
    if (fatigueScore > 0.7) {
      minDuration = 90;
      maxDuration = 300;
    } else if (fatigueScore > 0.5) {
      minDuration = 60;
      maxDuration = 180;
    }

    return { min: minDuration, max: maxDuration };
  }

  /**
   * Get all active routines (with caching)
   */
  private async getActiveRoutines(): Promise<Routine[]> {
    const cacheKey = 'active_routines';
    const cached = cache.get<Routine[]>(cacheKey);

    if (cached) {
      logger.debug('Routines retrieved from cache');
      return cached;
    }

    const result = await query(
      'SELECT * FROM dmn_routines WHERE is_active = true ORDER BY complexity_level, duration_seconds'
    );

    const routines = result.rows;
    cache.set(cacheKey, routines);
    logger.debug('Routines loaded from database', { count: routines.length });

    return routines;
  }

  /**
   * Get recently used routines for a student to avoid repetition
   */
  private async getRecentRoutines(studentId: string, limit: number = 5): Promise<string[]> {
    const result = await query(
      `SELECT DISTINCT routine_id
       FROM dmn_events
       WHERE session_id IN (
         SELECT id FROM dmn_sessions
         WHERE student_id = $1
         ORDER BY session_start DESC
         LIMIT 10
       )
       ORDER BY routine_id
       LIMIT $2`,
      [studentId, limit]
    );

    return result.rows.map((r: any) => r.routine_id);
  }

  /**
   * Filter and prioritize routine candidates
   */
  private async selectBestRoutine(
    routines: Routine[],
    context: SessionContext,
    durationRange: { min: number; max: number }
  ): Promise<Routine | null> {
    const { problem_complexity } = context;

    // Filter by complexity and duration
    let candidates = routines.filter(r =>
      r.complexity_level >= problem_complexity - 1 &&
      r.complexity_level <= problem_complexity + 1 &&
      r.duration_seconds >= durationRange.min &&
      r.duration_seconds <= durationRange.max
    );

    if (candidates.length === 0) {
      logger.warn('No routines match criteria, relaxing constraints');
      // Relax constraints - just filter by duration
      candidates = routines.filter(r =>
        r.duration_seconds >= durationRange.min &&
        r.duration_seconds <= durationRange.max
      );
    }

    if (candidates.length === 0) {
      logger.warn('Still no candidates, returning first available routine');
      return routines.length > 0 ? routines[0] : null;
    }

    // Avoid recently used routines
    const recentRoutines = await this.getRecentRoutines(context.student_id);
    const fresh = candidates.filter(c => !recentRoutines.includes(c.id));

    if (fresh.length > 0) {
      candidates = fresh;
    }

    // Prefer routines based on trigger point
    if (context.trigger_point === 'before') {
      // Before problem: prefer breathing, mindfulness to set focus
      const preferred = candidates.filter(c =>
        c.type === 'breathing' || c.type === 'mindfulness'
      );
      if (preferred.length > 0) candidates = preferred;
    } else {
      // After problem: prefer physical, visualization to reset
      const preferred = candidates.filter(c =>
        c.type === 'physical' || c.type === 'visualization'
      );
      if (preferred.length > 0) candidates = preferred;
    }

    // Select randomly from remaining candidates to add variety
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    logger.info('Routine selected', {
      routineId: selected.id,
      routineName: selected.name,
      candidateCount: candidates.length
    });

    return selected;
  }

  /**
   * Main recommendation method
   */
  async recommendRoutine(context: SessionContext): Promise<{
    routine: Routine | null;
    trigger_reason: string;
    fatigue_score: number;
  }> {
    logger.info('Generating routine recommendation', { context });

    // Calculate fatigue
    const fatigueScore = this.calculateFatigue(context);

    // Determine trigger reason
    let triggerReason = 'standard_interval';
    if (fatigueScore > 0.7) {
      triggerReason = 'high_fatigue_detected';
    } else if (context.problem_complexity >= 4) {
      triggerReason = 'problem_complexity_high';
    } else if (context.session_context.time_since_last_rest && context.session_context.time_since_last_rest > 20) {
      triggerReason = 'time_interval_exceeded';
    }

    // Get duration range
    const durationRange = this.getDurationRange(context.problem_complexity, fatigueScore);

    // Get active routines and select best match
    const routines = await this.getActiveRoutines();
    const routine = await this.selectBestRoutine(routines, context, durationRange);

    return {
      routine,
      trigger_reason: triggerReason,
      fatigue_score: fatigueScore
    };
  }
}

export default new RecommendationEngine();
