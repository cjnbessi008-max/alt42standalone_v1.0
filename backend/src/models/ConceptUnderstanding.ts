/**
 * Concept Understanding Model
 * Handles database operations for concept understanding tracking
 */

export interface Concept {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  category?: string;
  parentConceptId?: string;
  difficultyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptUnderstanding {
  id: string;
  studentId: string;
  conceptId: string;
  moduleId: string;
  understandingScore: number;
  attemptsCount: number;
  correctAttempts: number;
  timeSpentSeconds: number;
  lastInteractionAt: Date;
  masteryLevel: 'not_started' | 'struggling' | 'developing' | 'proficient' | 'mastered';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptInteraction {
  id: string;
  studentId: string;
  conceptId: string;
  moduleId: string;
  interactionType: 'problem_attempt' | 'video_watch' | 'quiz' | 'practice';
  isCorrect?: boolean;
  score?: number;
  timeSpentSeconds?: number;
  metadata?: Record<string, any>;
  interactionAt: Date;
  createdAt: Date;
}

export interface HeatmapData {
  moduleId: string;
  studentId: string;
  conceptId: string;
  conceptName: string;
  category?: string;
  understandingScore: number;
  masteryLevel: string;
  attemptsCount: number;
  lastInteractionAt: Date;
}

export interface ConceptDifficultyAnalysis {
  conceptId: string;
  conceptName: string;
  moduleId: string;
  category?: string;
  studentsAttempted: number;
  avgUnderstandingScore: number;
  scoreStdDev: number;
  strugglingStudents: number;
  masteredStudents: number;
  avgTimeSpent: number;
}

export class ConceptUnderstandingModel {
  private db: any; // Database connection (PostgreSQL pool)

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Get all concepts for a module
   */
  async getConceptsByModule(moduleId: string): Promise<Concept[]> {
    const query = `
      SELECT * FROM concepts
      WHERE module_id = $1
      ORDER BY category, difficulty_level, name
    `;
    const result = await this.db.query(query, [moduleId]);
    return result.rows.map(this.mapConceptFromDb);
  }

  /**
   * Get concept understanding for a specific student and module
   */
  async getStudentUnderstanding(
    studentId: string,
    moduleId: string
  ): Promise<ConceptUnderstanding[]> {
    const query = `
      SELECT * FROM concept_understanding
      WHERE student_id = $1 AND module_id = $2
      ORDER BY updated_at DESC
    `;
    const result = await this.db.query(query, [studentId, moduleId]);
    return result.rows.map(this.mapUnderstandingFromDb);
  }

  /**
   * Get heatmap data for a module
   */
  async getHeatmapData(moduleId: string): Promise<HeatmapData[]> {
    const query = `
      SELECT * FROM module_heatmap_data
      WHERE module_id = $1
      ORDER BY concept_name, student_id
    `;
    const result = await this.db.query(query, [moduleId]);
    return result.rows.map(this.mapHeatmapFromDb);
  }

  /**
   * Get heatmap data for specific students
   */
  async getHeatmapDataForStudents(
    moduleId: string,
    studentIds: string[]
  ): Promise<HeatmapData[]> {
    const query = `
      SELECT * FROM module_heatmap_data
      WHERE module_id = $1 AND student_id = ANY($2)
      ORDER BY concept_name, student_id
    `;
    const result = await this.db.query(query, [moduleId, studentIds]);
    return result.rows.map(this.mapHeatmapFromDb);
  }

  /**
   * Record a concept interaction
   */
  async recordInteraction(interaction: Omit<ConceptInteraction, 'id' | 'createdAt'>): Promise<ConceptInteraction> {
    const query = `
      INSERT INTO concept_interactions (
        student_id, concept_id, module_id, interaction_type,
        is_correct, score, time_spent_seconds, metadata, interaction_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      interaction.studentId,
      interaction.conceptId,
      interaction.moduleId,
      interaction.interactionType,
      interaction.isCorrect,
      interaction.score,
      interaction.timeSpentSeconds,
      interaction.metadata ? JSON.stringify(interaction.metadata) : null,
      interaction.interactionAt
    ];
    const result = await this.db.query(query, values);
    return this.mapInteractionFromDb(result.rows[0]);
  }

  /**
   * Update or create concept understanding
   */
  async updateUnderstanding(
    studentId: string,
    conceptId: string,
    moduleId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<ConceptUnderstanding> {
    const query = `
      INSERT INTO concept_understanding (
        student_id, concept_id, module_id,
        understanding_score, attempts_count, correct_attempts,
        time_spent_seconds, last_interaction_at, mastery_level
      ) VALUES ($1, $2, $3, $4, 1, $5, $6, NOW(), $7)
      ON CONFLICT (student_id, concept_id, module_id)
      DO UPDATE SET
        attempts_count = concept_understanding.attempts_count + 1,
        correct_attempts = concept_understanding.correct_attempts + $5,
        time_spent_seconds = concept_understanding.time_spent_seconds + $6,
        understanding_score = LEAST(100, (concept_understanding.correct_attempts + $5)::DECIMAL / (concept_understanding.attempts_count + 1) * 100),
        mastery_level = CASE
          WHEN (concept_understanding.correct_attempts + $5)::DECIMAL / (concept_understanding.attempts_count + 1) * 100 >= 90 THEN 'mastered'::VARCHAR
          WHEN (concept_understanding.correct_attempts + $5)::DECIMAL / (concept_understanding.attempts_count + 1) * 100 >= 80 THEN 'proficient'::VARCHAR
          WHEN (concept_understanding.correct_attempts + $5)::DECIMAL / (concept_understanding.attempts_count + 1) * 100 >= 60 THEN 'developing'::VARCHAR
          WHEN (concept_understanding.correct_attempts + $5)::DECIMAL / (concept_understanding.attempts_count + 1) * 100 >= 40 THEN 'struggling'::VARCHAR
          ELSE 'not_started'::VARCHAR
        END,
        last_interaction_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    const score = isCorrect ? 100 : 0;
    const correctIncrement = isCorrect ? 1 : 0;
    const values = [studentId, conceptId, moduleId, score, correctIncrement, timeSpent, 'not_started'];
    const result = await this.db.query(query, values);
    return this.mapUnderstandingFromDb(result.rows[0]);
  }

  /**
   * Get concept difficulty analysis
   */
  async getConceptDifficultyAnalysis(moduleId: string): Promise<ConceptDifficultyAnalysis[]> {
    const query = `
      SELECT * FROM concept_difficulty_analysis
      WHERE module_id = $1
      ORDER BY avg_understanding_score ASC
    `;
    const result = await this.db.query(query, [moduleId]);
    return result.rows.map(this.mapDifficultyAnalysisFromDb);
  }

  /**
   * Get student mastery summary
   */
  async getStudentMasterySummary(studentId: string, moduleId: string) {
    const query = `
      SELECT * FROM student_concept_mastery
      WHERE student_id = $1 AND module_id = $2
      ORDER BY concept_name
    `;
    const result = await this.db.query(query, [studentId, moduleId]);
    return result.rows;
  }

  // Helper methods to map database rows to TypeScript interfaces
  private mapConceptFromDb(row: any): Concept {
    return {
      id: row.id,
      moduleId: row.module_id,
      name: row.name,
      description: row.description,
      category: row.category,
      parentConceptId: row.parent_concept_id,
      difficultyLevel: row.difficulty_level,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapUnderstandingFromDb(row: any): ConceptUnderstanding {
    return {
      id: row.id,
      studentId: row.student_id,
      conceptId: row.concept_id,
      moduleId: row.module_id,
      understandingScore: parseFloat(row.understanding_score),
      attemptsCount: row.attempts_count,
      correctAttempts: row.correct_attempts,
      timeSpentSeconds: row.time_spent_seconds,
      lastInteractionAt: row.last_interaction_at,
      masteryLevel: row.mastery_level,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapInteractionFromDb(row: any): ConceptInteraction {
    return {
      id: row.id,
      studentId: row.student_id,
      conceptId: row.concept_id,
      moduleId: row.module_id,
      interactionType: row.interaction_type,
      isCorrect: row.is_correct,
      score: row.score ? parseFloat(row.score) : undefined,
      timeSpentSeconds: row.time_spent_seconds,
      metadata: row.metadata,
      interactionAt: row.interaction_at,
      createdAt: row.created_at
    };
  }

  private mapHeatmapFromDb(row: any): HeatmapData {
    return {
      moduleId: row.module_id,
      studentId: row.student_id,
      conceptId: row.concept_id,
      conceptName: row.concept_name,
      category: row.category,
      understandingScore: parseFloat(row.understanding_score || 0),
      masteryLevel: row.mastery_level,
      attemptsCount: row.attempts_count,
      lastInteractionAt: row.last_interaction_at
    };
  }

  private mapDifficultyAnalysisFromDb(row: any): ConceptDifficultyAnalysis {
    return {
      conceptId: row.concept_id,
      conceptName: row.concept_name,
      moduleId: row.module_id,
      category: row.category,
      studentsAttempted: parseInt(row.students_attempted || 0),
      avgUnderstandingScore: parseFloat(row.avg_understanding_score || 0),
      scoreStdDev: parseFloat(row.score_std_dev || 0),
      strugglingStudents: parseInt(row.struggling_students || 0),
      masteredStudents: parseInt(row.mastered_students || 0),
      avgTimeSpent: parseFloat(row.avg_time_spent || 0)
    };
  }
}
