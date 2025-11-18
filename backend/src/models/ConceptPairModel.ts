import db from '../services/database';
import {
  ConceptPair,
  ConceptPairCategory,
  WarningSeverity,
  CreateConceptPairDTO
} from '../types';

export class ConceptPairModel {
  // Get all active concept pairs
  async findAll(): Promise<ConceptPair[]> {
    const query = `
      SELECT
        id, concept_a as "conceptA", concept_a_kr as "conceptAKr",
        concept_a_description as "conceptADescription",
        concept_b as "conceptB", concept_b_kr as "conceptBKr",
        concept_b_description as "conceptBDescription",
        category, grade_level_min as "gradeLevelMin",
        grade_level_max as "gradeLevelMax",
        confusion_reason as "confusionReason",
        confusion_reason_kr as "confusionReasonKr",
        warning_message as "warningMessage",
        warning_message_kr as "warningMessageKr",
        severity, example_a as "exampleA", example_b as "exampleB",
        differentiation_tip as "differentiationTip",
        differentiation_tip_kr as "differentiationTipKr",
        times_warned as "timesWarned",
        effectiveness_score as "effectivenessScore",
        is_active as "isActive", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM concept_pairs
      WHERE is_active = true
      ORDER BY severity DESC, times_warned DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  // Find by ID
  async findById(id: string): Promise<ConceptPair | null> {
    const query = `
      SELECT
        id, concept_a as "conceptA", concept_a_kr as "conceptAKr",
        concept_a_description as "conceptADescription",
        concept_b as "conceptB", concept_b_kr as "conceptBKr",
        concept_b_description as "conceptBDescription",
        category, grade_level_min as "gradeLevelMin",
        grade_level_max as "gradeLevelMax",
        confusion_reason as "confusionReason",
        confusion_reason_kr as "confusionReasonKr",
        warning_message as "warningMessage",
        warning_message_kr as "warningMessageKr",
        severity, example_a as "exampleA", example_b as "exampleB",
        differentiation_tip as "differentiationTip",
        differentiation_tip_kr as "differentiationTipKr",
        times_warned as "timesWarned",
        effectiveness_score as "effectivenessScore",
        is_active as "isActive", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM concept_pairs
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find by category
  async findByCategory(category: ConceptPairCategory): Promise<ConceptPair[]> {
    const query = `
      SELECT
        id, concept_a as "conceptA", concept_a_kr as "conceptAKr",
        concept_a_description as "conceptADescription",
        concept_b as "conceptB", concept_b_kr as "conceptBKr",
        concept_b_description as "conceptBDescription",
        category, grade_level_min as "gradeLevelMin",
        grade_level_max as "gradeLevelMax",
        confusion_reason as "confusionReason",
        confusion_reason_kr as "confusionReasonKr",
        warning_message as "warningMessage",
        warning_message_kr as "warningMessageKr",
        severity, example_a as "exampleA", example_b as "exampleB",
        differentiation_tip as "differentiationTip",
        differentiation_tip_kr as "differentiationTipKr",
        times_warned as "timesWarned",
        effectiveness_score as "effectivenessScore",
        is_active as "isActive", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM concept_pairs
      WHERE category = $1 AND is_active = true
      ORDER BY severity DESC
    `;

    const result = await db.query(query, [category]);
    return result.rows;
  }

  // Find by grade level
  async findByGradeLevel(gradeLevel: number): Promise<ConceptPair[]> {
    const query = `
      SELECT
        id, concept_a as "conceptA", concept_a_kr as "conceptAKr",
        concept_a_description as "conceptADescription",
        concept_b as "conceptB", concept_b_kr as "conceptBKr",
        concept_b_description as "conceptBDescription",
        category, grade_level_min as "gradeLevelMin",
        grade_level_max as "gradeLevelMax",
        confusion_reason as "confusionReason",
        confusion_reason_kr as "confusionReasonKr",
        warning_message as "warningMessage",
        warning_message_kr as "warningMessageKr",
        severity, example_a as "exampleA", example_b as "exampleB",
        differentiation_tip as "differentiationTip",
        differentiation_tip_kr as "differentiationTipKr",
        times_warned as "timesWarned",
        effectiveness_score as "effectivenessScore",
        is_active as "isActive", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM concept_pairs
      WHERE $1 BETWEEN grade_level_min AND grade_level_max
        AND is_active = true
      ORDER BY severity DESC
    `;

    const result = await db.query(query, [gradeLevel]);
    return result.rows;
  }

  // Create new concept pair
  async create(data: CreateConceptPairDTO): Promise<ConceptPair> {
    const query = `
      INSERT INTO concept_pairs (
        concept_a, concept_a_kr, concept_a_description,
        concept_b, concept_b_kr, concept_b_description,
        category, grade_level_min, grade_level_max,
        confusion_reason, confusion_reason_kr,
        warning_message, warning_message_kr,
        severity, example_a, example_b,
        differentiation_tip, differentiation_tip_kr
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING
        id, concept_a as "conceptA", concept_a_kr as "conceptAKr",
        concept_a_description as "conceptADescription",
        concept_b as "conceptB", concept_b_kr as "conceptBKr",
        concept_b_description as "conceptBDescription",
        category, grade_level_min as "gradeLevelMin",
        grade_level_max as "gradeLevelMax",
        confusion_reason as "confusionReason",
        confusion_reason_kr as "confusionReasonKr",
        warning_message as "warningMessage",
        warning_message_kr as "warningMessageKr",
        severity, example_a as "exampleA", example_b as "exampleB",
        differentiation_tip as "differentiationTip",
        differentiation_tip_kr as "differentiationTipKr",
        times_warned as "timesWarned",
        effectiveness_score as "effectivenessScore",
        is_active as "isActive", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const values = [
      data.conceptA,
      data.conceptAKr,
      data.conceptADescription,
      data.conceptB,
      data.conceptBKr,
      data.conceptBDescription,
      data.category,
      data.gradeLevelMin,
      data.gradeLevelMax,
      data.confusionReason,
      data.confusionReasonKr,
      data.warningMessage,
      data.warningMessageKr,
      data.severity || WarningSeverity.MEDIUM,
      data.exampleA,
      data.exampleB,
      data.differentiationTip,
      data.differentiationTipKr
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Increment times warned counter
  async incrementTimesWarned(id: string): Promise<void> {
    const query = `
      UPDATE concept_pairs
      SET times_warned = times_warned + 1
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  // Update effectiveness score
  async updateEffectivenessScore(id: string, score: number): Promise<void> {
    const query = `
      UPDATE concept_pairs
      SET effectiveness_score = $2
      WHERE id = $1
    `;

    await db.query(query, [id, score]);
  }

  // Deactivate concept pair
  async deactivate(id: string): Promise<void> {
    const query = `
      UPDATE concept_pairs
      SET is_active = false
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }
}

export default new ConceptPairModel();
