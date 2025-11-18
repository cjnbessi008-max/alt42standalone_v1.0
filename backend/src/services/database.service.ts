import { Pool, QueryResult } from 'pg';
import { pool } from '../index';
import { FunctionTree } from './function-parser.service';

/**
 * DatabaseService
 * 데이터베이스 CRUD 작업을 처리하는 서비스
 */
export class DatabaseService {
  /**
   * 모든 문제 조회
   */
  async getAllProblems(): Promise<any[]> {
    const query = `
      SELECT
        id,
        title,
        description,
        function_expression,
        difficulty_level,
        category,
        created_at
      FROM problems
      ORDER BY difficulty_level, created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * 특정 문제 조회
   */
  async getProblemById(id: string): Promise<any> {
    const query = `
      SELECT
        id,
        title,
        description,
        function_expression,
        difficulty_level,
        category,
        created_at
      FROM problems
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error(`Problem with id ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * 난이도별 문제 조회
   */
  async getProblemsByDifficulty(level: number): Promise<any[]> {
    const query = `
      SELECT
        id,
        title,
        description,
        function_expression,
        difficulty_level,
        category,
        created_at
      FROM problems
      WHERE difficulty_level = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [level]);
    return result.rows;
  }

  /**
   * 카테고리별 문제 조회
   */
  async getProblemsByCategory(category: string): Promise<any[]> {
    const query = `
      SELECT
        id,
        title,
        description,
        function_expression,
        difficulty_level,
        category,
        created_at
      FROM problems
      WHERE category = $1
      ORDER BY difficulty_level, created_at DESC
    `;

    const result = await pool.query(query, [category]);
    return result.rows;
  }

  /**
   * 함수 트리 저장
   */
  async saveFunctionTree(
    problemId: string,
    expression: string,
    tree: FunctionTree
  ): Promise<string> {
    const query = `
      INSERT INTO function_trees (
        problem_id,
        expression,
        tree_data,
        node_count,
        depth
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const treeData = JSON.stringify(tree);
    const values = [
      problemId,
      expression,
      treeData,
      tree.nodeCount,
      tree.maxDepth,
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  /**
   * 저장된 함수 트리 조회
   */
  async getFunctionTree(treeId: string): Promise<any> {
    const query = `
      SELECT
        id,
        problem_id,
        expression,
        tree_data,
        node_count,
        depth,
        created_at
      FROM function_trees
      WHERE id = $1
    `;

    const result = await pool.query(query, [treeId]);

    if (result.rows.length === 0) {
      throw new Error(`Function tree with id ${treeId} not found`);
    }

    return result.rows[0];
  }

  /**
   * 문제에 연결된 함수 트리 조회
   */
  async getFunctionTreesByProblem(problemId: string): Promise<any[]> {
    const query = `
      SELECT
        id,
        problem_id,
        expression,
        tree_data,
        node_count,
        depth,
        created_at
      FROM function_trees
      WHERE problem_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [problemId]);
    return result.rows;
  }

  /**
   * 학생 진행 상황 저장/업데이트
   */
  async updateStudentProgress(
    studentId: string,
    problemId: string,
    isCompleted: boolean,
    timeSpent: number
  ): Promise<void> {
    const query = `
      INSERT INTO student_progress (
        student_id,
        problem_id,
        is_completed,
        attempts,
        time_spent_seconds,
        last_attempt_at,
        completed_at
      )
      VALUES ($1, $2, $3, 1, $4, CURRENT_TIMESTAMP, $5)
      ON CONFLICT (student_id, problem_id)
      DO UPDATE SET
        is_completed = EXCLUDED.is_completed,
        attempts = student_progress.attempts + 1,
        time_spent_seconds = student_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
        last_attempt_at = CURRENT_TIMESTAMP,
        completed_at = CASE
          WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP
          ELSE student_progress.completed_at
        END
    `;

    const completedAt = isCompleted ? new Date() : null;
    await pool.query(query, [studentId, problemId, isCompleted, timeSpent, completedAt]);
  }

  /**
   * 학생의 인터랙션 기록
   */
  async logStudentInteraction(
    studentId: string,
    problemId: string,
    nodeId: string,
    interactionType: string,
    metadata?: any
  ): Promise<void> {
    const query = `
      INSERT INTO student_interactions (
        student_id,
        problem_id,
        node_id,
        interaction_type,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5)
    `;

    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    await pool.query(query, [studentId, problemId, nodeId, interactionType, metadataJson]);
  }

  /**
   * 학생별 문제 진행 상황 조회
   */
  async getStudentProgress(studentId: string): Promise<any[]> {
    const query = `
      SELECT
        sp.id,
        sp.problem_id,
        p.title as problem_title,
        p.difficulty_level,
        sp.is_completed,
        sp.attempts,
        sp.time_spent_seconds,
        sp.last_attempt_at,
        sp.completed_at
      FROM student_progress sp
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = $1
      ORDER BY sp.last_attempt_at DESC
    `;

    const result = await pool.query(query, [studentId]);
    return result.rows;
  }
}

export default new DatabaseService();
