import db from './database';
import ConceptPairModel from '../models/ConceptPairModel';
import {
  ConceptPair,
  ConceptPairTrigger,
  CheckWarningRequest,
  CheckWarningResponse,
  TriggerType
} from '../types';

export class WarningDetectionService {
  /**
   * Check if student input triggers any concept pair warnings
   */
  async checkForWarnings(request: CheckWarningRequest): Promise<CheckWarningResponse> {
    const { studentId, inputText, activityType, sessionId, moduleId, problemData } = request;

    // Get all active triggers
    const triggers = await this.getActiveTriggers();

    const warningsTriggered: CheckWarningResponse['warningsTriggered'] = [];

    // Check each trigger against the input
    for (const trigger of triggers) {
      if (await this.evaluateTrigger(trigger, inputText, request)) {
        const conceptPair = await ConceptPairModel.findById(trigger.conceptPairId);

        if (conceptPair && conceptPair.isActive) {
          // Check if student has been warned recently for this concept pair
          const recentlyWarned = await this.wasRecentlyWarned(
            studentId,
            conceptPair.id,
            trigger.timeWindowMinutes || 30
          );

          if (!recentlyWarned) {
            // Create warning record
            const warningId = await this.createWarningRecord({
              studentId,
              moduleId,
              sessionId,
              conceptPairId: conceptPair.id,
              triggerId: trigger.id,
              activityType,
              problemData
            });

            // Increment times warned counter
            await ConceptPairModel.incrementTimesWarned(conceptPair.id);

            warningsTriggered.push({
              conceptPair,
              trigger,
              warningId
            });
          }
        }
      }
    }

    return {
      warningsTriggered,
      shouldShowWarning: warningsTriggered.length > 0
    };
  }

  /**
   * Get all active triggers
   */
  private async getActiveTriggers(): Promise<ConceptPairTrigger[]> {
    const query = `
      SELECT
        id, concept_pair_id as "conceptPairId",
        trigger_type as "triggerType",
        trigger_pattern as "triggerPattern",
        trigger_context as "triggerContext",
        min_occurrences as "minOccurrences",
        time_window_minutes as "timeWindowMinutes",
        is_active as "isActive",
        created_at as "createdAt"
      FROM concept_pair_triggers
      WHERE is_active = true
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Evaluate if a trigger matches the given input
   */
  private async evaluateTrigger(
    trigger: ConceptPairTrigger,
    inputText: string,
    request: CheckWarningRequest
  ): Promise<boolean> {
    const lowerInput = inputText.toLowerCase();

    switch (trigger.triggerType) {
      case TriggerType.KEYWORD:
        return this.evaluateKeywordTrigger(trigger, lowerInput);

      case TriggerType.PATTERN:
        return this.evaluatePatternTrigger(trigger, lowerInput, request);

      case TriggerType.CONTEXT:
        return this.evaluateContextTrigger(trigger, request);

      case TriggerType.SEQUENCE:
        return this.evaluateSequenceTrigger(trigger, request);

      default:
        return false;
    }
  }

  /**
   * Evaluate keyword-based trigger
   */
  private evaluateKeywordTrigger(trigger: ConceptPairTrigger, inputText: string): boolean {
    try {
      const regex = new RegExp(trigger.triggerPattern, 'i');
      return regex.test(inputText);
    } catch (error) {
      console.error('Error evaluating keyword trigger', { trigger, error });
      return false;
    }
  }

  /**
   * Evaluate pattern-based trigger (more complex logic)
   */
  private evaluatePatternTrigger(
    trigger: ConceptPairTrigger,
    inputText: string,
    request: CheckWarningRequest
  ): boolean {
    // Custom pattern matching logic
    const pattern = trigger.triggerPattern;

    // Example: Check for fraction operation confusion
    if (pattern === 'fraction_operation_confusion' && request.problemData) {
      return this.detectFractionOperationConfusion(request.problemData);
    }

    // Add more pattern types as needed
    return false;
  }

  /**
   * Evaluate context-based trigger
   */
  private evaluateContextTrigger(
    trigger: ConceptPairTrigger,
    request: CheckWarningRequest
  ): boolean {
    // Context-based evaluation using activity type, problem data, etc.
    const context = trigger.triggerContext;

    if (!context) return false;

    // Example: Check if activity type matches
    if (context.activityType && request.activityType === context.activityType) {
      return true;
    }

    return false;
  }

  /**
   * Evaluate sequence-based trigger (requires historical data)
   */
  private async evaluateSequenceTrigger(
    trigger: ConceptPairTrigger,
    request: CheckWarningRequest
  ): Promise<boolean> {
    // Check for patterns in student's recent activity sequence
    // This would require querying student's recent actions
    // Placeholder for now
    return false;
  }

  /**
   * Detect fraction operation confusion
   */
  private detectFractionOperationConfusion(problemData: Record<string, any>): boolean {
    // Example: Student adds numerators and denominators in multiplication
    // 1/2 * 2/3 = (1+2)/(2+3) instead of (1*2)/(2*3)
    if (
      problemData.operation === 'multiply' &&
      problemData.studentAnswer &&
      problemData.correctAnswer
    ) {
      // Check if student added instead of multiplied
      const { num1, den1, num2, den2 } = problemData;
      const studentNum = problemData.studentAnswer.numerator;
      const studentDen = problemData.studentAnswer.denominator;

      // Did student add numerators and denominators?
      if (studentNum === num1 + num2 && studentDen === den1 + den2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if student was recently warned for this concept pair
   */
  private async wasRecentlyWarned(
    studentId: string,
    conceptPairId: string,
    timeWindowMinutes: number
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM student_concept_warnings
      WHERE student_id = $1
        AND concept_pair_id = $2
        AND warning_shown_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'
    `;

    const result = await db.query(query, [studentId, conceptPairId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Create a warning record
   */
  private async createWarningRecord(data: {
    studentId: string;
    moduleId?: string;
    sessionId?: string;
    conceptPairId: string;
    triggerId?: string;
    activityType?: string;
    problemData?: Record<string, any>;
  }): Promise<string> {
    const query = `
      INSERT INTO student_concept_warnings (
        student_id, module_id, session_id,
        concept_pair_id, trigger_id,
        activity_type, problem_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const values = [
      data.studentId,
      data.moduleId,
      data.sessionId,
      data.conceptPairId,
      data.triggerId,
      data.activityType,
      data.problemData ? JSON.stringify(data.problemData) : null
    ];

    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Record student acknowledgment of warning
   */
  async acknowledgeWarning(warningId: string, acknowledged: boolean, dismissed: boolean = false): Promise<void> {
    const query = `
      UPDATE student_concept_warnings
      SET
        student_acknowledged = $2,
        acknowledged_at = CASE WHEN $2 = true THEN NOW() ELSE acknowledged_at END,
        student_dismissed = $3,
        dismissed_at = CASE WHEN $3 = true THEN NOW() ELSE dismissed_at END
      WHERE id = $1
    `;

    await db.query(query, [warningId, acknowledged, dismissed]);
  }

  /**
   * Update warning effectiveness metrics
   */
  async updateWarningEffectiveness(
    warningId: string,
    correctedMistake: boolean,
    timeToCorrectionSeconds?: number,
    followUpImproved?: boolean
  ): Promise<void> {
    const query = `
      UPDATE student_concept_warnings
      SET
        student_corrected_mistake = $2,
        time_to_correction_seconds = $3,
        follow_up_performance_improved = $4
      WHERE id = $1
    `;

    await db.query(query, [
      warningId,
      correctedMistake,
      timeToCorrectionSeconds,
      followUpImproved
    ]);
  }

  /**
   * Get warning statistics for a concept pair
   */
  async getWarningStatistics(conceptPairId: string, days: number = 30) {
    const query = `
      SELECT
        COUNT(*) as total_warnings,
        COUNT(DISTINCT student_id) as unique_students,
        AVG(CASE WHEN student_acknowledged THEN 1.0 ELSE 0.0 END) as acknowledgment_rate,
        AVG(CASE WHEN student_corrected_mistake THEN 1.0 ELSE 0.0 END) as correction_rate,
        AVG(time_to_correction_seconds) as avg_correction_time
      FROM student_concept_warnings
      WHERE concept_pair_id = $1
        AND warning_shown_at > NOW() - INTERVAL '${days} days'
    `;

    const result = await db.query(query, [conceptPairId]);
    return result.rows[0];
  }
}

export default new WarningDetectionService();
