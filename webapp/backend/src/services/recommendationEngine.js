/**
 * Hybrid Recommendation Engine
 * Combines content-based, collaborative filtering, and knowledge graph approaches
 */

export class RecommendationEngine {
  constructor(db) {
    this.db = db;
    this.weights = {
      contentBased: 0.4,
      collaborative: 0.3,
      knowledgeGraph: 0.3
    };
  }

  /**
   * Main recommendation method
   */
  async getRecommendations(studentId, limit = 10, minConfidence = 0.5) {
    // Get student's current state
    const studentState = this.getStudentState(studentId);

    if (!studentState) {
      throw new Error('Student not found');
    }

    // Generate recommendations from different algorithms
    const contentRecs = this.contentBasedRecommendations(studentId, studentState);
    const collaborativeRecs = this.collaborativeFiltering(studentId, studentState);
    const knowledgeRecs = this.knowledgeGraphRecommendations(studentId, studentState);

    // Combine and rank recommendations
    const combined = this.combineRecommendations(
      contentRecs,
      collaborativeRecs,
      knowledgeRecs
    );

    // Filter by confidence and limit
    const filtered = combined
      .filter(rec => rec.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    // Add reasoning
    return filtered.map(rec => ({
      ...rec,
      student_id: studentId,
      generated_at: new Date().toISOString()
    }));
  }

  /**
   * Get student's current learning state
   */
  getStudentState(studentId) {
    const query = `
      SELECT
        s.*,
        GROUP_CONCAT(DISTINCT sp.concept_id) as studied_concepts,
        GROUP_CONCAT(DISTINCT sp.problem_id) as attempted_problems,
        AVG(sp.best_score) as avg_score,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
        COUNT(DISTINCT sp.problem_id) as total_attempts
      FROM students s
      LEFT JOIN student_progress sp ON s.id = sp.student_id
      WHERE s.id = ?
      GROUP BY s.id
    `;

    const student = this.db.prepare(query).get(studentId);

    if (!student) return null;

    return {
      ...student,
      studied_concepts: student.studied_concepts
        ? student.studied_concepts.split(',').map(Number)
        : [],
      attempted_problems: student.attempted_problems
        ? student.attempted_problems.split(',').map(Number)
        : []
    };
  }

  /**
   * Content-Based Filtering
   * Recommends based on concept similarity and difficulty matching
   */
  contentBasedRecommendations(studentId, studentState) {
    const recommendations = [];

    // Find weak concepts (low scores or in-progress)
    const weakConcepts = this.db.prepare(`
      SELECT
        c.id,
        c.name,
        c.difficulty_level,
        AVG(sp.best_score) as avg_score,
        COUNT(sp.id) as attempt_count
      FROM concepts c
      JOIN student_progress sp ON c.id = sp.concept_id
      WHERE sp.student_id = ?
        AND sp.status != 'mastered'
      GROUP BY c.id
      ORDER BY avg_score ASC, attempt_count DESC
      LIMIT 5
    `).all(studentId);

    // Find problems for weak concepts
    for (const concept of weakConcepts) {
      const problems = this.db.prepare(`
        SELECT
          p.id,
          p.title,
          p.difficulty_level,
          cpm.relevance_score,
          cpm.concept_id
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id = ?
          AND p.id NOT IN (
            SELECT problem_id FROM student_progress
            WHERE student_id = ? AND status = 'mastered'
          )
        ORDER BY cpm.relevance_score DESC, p.difficulty_level ASC
        LIMIT 3
      `).all(concept.id, studentId);

      for (const problem of problems) {
        const confidence = this.calculateContentConfidence(
          concept,
          problem,
          studentState
        );

        recommendations.push({
          problem_id: problem.id,
          concept_id: problem.concept_id,
          confidence,
          algorithm: 'content_based',
          reason: `Helps strengthen "${concept.name}" (weak area, avg score: ${concept.avg_score?.toFixed(0) || 'N/A'})`
        });
      }
    }

    // Also recommend next logical concepts
    const nextConcepts = this.getNextLogicalConcepts(studentId);
    for (const concept of nextConcepts) {
      const problems = this.db.prepare(`
        SELECT p.id, p.title, cpm.concept_id, cpm.relevance_score
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id = ? AND cpm.is_primary = 1
        LIMIT 2
      `).all(concept.id);

      for (const problem of problems) {
        recommendations.push({
          problem_id: problem.id,
          concept_id: problem.concept_id,
          confidence: 0.7,
          algorithm: 'content_based',
          reason: `Next concept to learn: "${concept.name}"`
        });
      }
    }

    return recommendations;
  }

  /**
   * Collaborative Filtering
   * Recommends based on similar students' success patterns
   */
  collaborativeFiltering(studentId, studentState) {
    const recommendations = [];

    // Find similar students (same grade level, similar performance)
    const similarStudents = this.db.prepare(`
      SELECT
        s.id,
        s.name,
        AVG(sp.best_score) as avg_score,
        COUNT(DISTINCT sp.concept_id) as concepts_studied
      FROM students s
      JOIN student_progress sp ON s.id = sp.student_id
      WHERE s.id != ?
        AND s.grade_level = (SELECT grade_level FROM students WHERE id = ?)
      GROUP BY s.id
      HAVING ABS(avg_score - ?) < 20
      ORDER BY ABS(avg_score - ?) ASC
      LIMIT 5
    `).all(studentId, studentId, studentState.avg_score || 75, studentState.avg_score || 75);

    // Find problems that similar students mastered but current student hasn't
    for (const similar of similarStudents) {
      const successfulProblems = this.db.prepare(`
        SELECT
          p.id,
          p.title,
          sp.concept_id,
          sp.best_score,
          COUNT(*) as mastered_by_similar
        FROM student_progress sp
        JOIN problems p ON sp.problem_id = p.id
        WHERE sp.student_id = ?
          AND sp.status = 'mastered'
          AND p.id NOT IN (
            SELECT problem_id FROM student_progress
            WHERE student_id = ? AND status IN ('completed', 'mastered')
          )
        GROUP BY p.id
        ORDER BY sp.best_score DESC
        LIMIT 3
      `).all(similar.id, studentId);

      for (const problem of successfulProblems) {
        const confidence = 0.6 + (problem.best_score / 100) * 0.2;

        recommendations.push({
          problem_id: problem.id,
          concept_id: problem.concept_id,
          confidence: Math.min(confidence, 0.9),
          algorithm: 'collaborative',
          reason: `Students similar to you mastered this successfully`
        });
      }
    }

    return recommendations;
  }

  /**
   * Knowledge Graph Recommendations
   * Uses concept prerequisites and learning paths
   */
  knowledgeGraphRecommendations(studentId, studentState) {
    const recommendations = [];

    // Check prerequisites - recommend problems for missing prerequisites
    const missingPrereqs = this.db.prepare(`
      SELECT
        c.id as concept_id,
        c.name as concept_name,
        cp.prerequisite_id,
        pc.name as prerequisite_name,
        cp.importance
      FROM concepts c
      JOIN concept_prerequisites cp ON c.id = cp.concept_id
      JOIN concepts pc ON cp.prerequisite_id = pc.id
      WHERE cp.prerequisite_id NOT IN (
        SELECT concept_id FROM student_progress
        WHERE student_id = ? AND status = 'mastered'
      )
      AND cp.importance = 'required'
      ORDER BY cp.importance DESC
      LIMIT 5
    `).all(studentId);

    for (const prereq of missingPrereqs) {
      const problems = this.db.prepare(`
        SELECT p.id, p.title, cpm.concept_id
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id = ?
          AND p.difficulty_level = 'easy'
          AND p.id NOT IN (
            SELECT problem_id FROM student_progress
            WHERE student_id = ? AND status = 'mastered'
          )
        ORDER BY p.points ASC
        LIMIT 2
      `).all(prereq.prerequisite_id, studentId);

      for (const problem of problems) {
        recommendations.push({
          problem_id: problem.id,
          concept_id: problem.concept_id,
          confidence: 0.85,
          algorithm: 'knowledge_graph',
          reason: `Required prerequisite for "${prereq.concept_name}": learn "${prereq.prerequisite_name}" first`
        });
      }
    }

    // Recommend progressive difficulty within mastered concepts
    const progressiveDifficulty = this.db.prepare(`
      SELECT
        c.id as concept_id,
        c.name as concept_name,
        MAX(p.difficulty_level) as current_level
      FROM concepts c
      JOIN student_progress sp ON c.id = sp.concept_id
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = ? AND sp.status = 'mastered'
      GROUP BY c.id
    `).all(studentId);

    const difficultyMap = { 'easy': 'medium', 'medium': 'hard' };

    for (const prog of progressiveDifficulty) {
      const nextLevel = difficultyMap[prog.current_level];
      if (!nextLevel) continue;

      const nextProblems = this.db.prepare(`
        SELECT p.id, p.title, cpm.concept_id
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id = ?
          AND p.difficulty_level = ?
          AND p.id NOT IN (
            SELECT problem_id FROM student_progress
            WHERE student_id = ?
          )
        LIMIT 1
      `).all(prog.concept_id, nextLevel, studentId);

      for (const problem of nextProblems) {
        recommendations.push({
          problem_id: problem.id,
          concept_id: problem.concept_id,
          confidence: 0.75,
          algorithm: 'knowledge_graph',
          reason: `Next difficulty level for "${prog.concept_name}"`
        });
      }
    }

    return recommendations;
  }

  /**
   * Combine recommendations from different algorithms
   */
  combineRecommendations(contentRecs, collaborativeRecs, knowledgeRecs) {
    const combined = new Map();

    // Helper to add/update recommendation
    const addRec = (rec, weight) => {
      const key = `${rec.problem_id}-${rec.concept_id}`;

      if (combined.has(key)) {
        const existing = combined.get(key);
        existing.confidence = Math.max(
          existing.confidence,
          rec.confidence * weight
        );
        existing.algorithms.push(rec.algorithm);
        existing.reasons.push(rec.reason);
      } else {
        combined.set(key, {
          ...rec,
          confidence: rec.confidence * weight,
          algorithms: [rec.algorithm],
          reasons: [rec.reason]
        });
      }
    };

    // Add weighted recommendations
    contentRecs.forEach(rec => addRec(rec, this.weights.contentBased));
    collaborativeRecs.forEach(rec => addRec(rec, this.weights.collaborative));
    knowledgeRecs.forEach(rec => addRec(rec, this.weights.knowledgeGraph));

    // Convert to array and enhance
    return Array.from(combined.values()).map(rec => ({
      problem_id: rec.problem_id,
      concept_id: rec.concept_id,
      confidence: Math.min(rec.confidence, 1.0),
      algorithm: rec.algorithms.length > 1 ? 'hybrid' : rec.algorithms[0],
      reason: rec.reasons[0], // Primary reason
      all_reasons: rec.reasons,
      supporting_algorithms: rec.algorithms
    }));
  }

  /**
   * Calculate confidence for content-based recommendation
   */
  calculateContentConfidence(concept, problem, studentState) {
    let confidence = 0.5;

    // Lower concept score = higher confidence for recommendation
    if (concept.avg_score < 50) {
      confidence += 0.3;
    } else if (concept.avg_score < 70) {
      confidence += 0.2;
    } else {
      confidence += 0.1;
    }

    // Higher relevance score = higher confidence
    confidence += (problem.relevance_score - 0.5) * 0.2;

    // Attempt count factor (more attempts without mastery = higher priority)
    if (concept.attempt_count > 3) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get next logical concepts to learn
   */
  getNextLogicalConcepts(studentId) {
    return this.db.prepare(`
      SELECT DISTINCT c.*
      FROM concepts c
      WHERE c.id NOT IN (
        SELECT concept_id FROM student_progress
        WHERE student_id = ? AND status IN ('completed', 'mastered')
      )
      AND (
        c.parent_concept_id IS NULL
        OR c.parent_concept_id IN (
          SELECT concept_id FROM student_progress
          WHERE student_id = ? AND status = 'mastered'
        )
      )
      ORDER BY c.difficulty_level ASC
      LIMIT 3
    `).all(studentId, studentId);
  }

  /**
   * Save recommendations to database (for caching and analysis)
   */
  saveRecommendations(recommendations) {
    const insert = this.db.prepare(`
      INSERT INTO recommendations (
        student_id, problem_id, concept_id, confidence_score,
        algorithm, reason, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 day'))
    `);

    const insertMany = this.db.transaction((recs) => {
      for (const rec of recs) {
        insert.run(
          rec.student_id,
          rec.problem_id,
          rec.concept_id,
          rec.confidence,
          rec.algorithm,
          rec.reason
        );
      }
    });

    insertMany(recommendations);
  }
}
