import pool from '../config/database';
import { Problem, TreeNode, ProblemType } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

class ProblemService {
  /**
   * Get all problems
   */
  async getAllProblems(): Promise<Problem[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems ORDER BY created_at DESC'
    );

    return rows.map(row => this.mapRowToProblem(row));
  }

  /**
   * Get problem by ID
   */
  async getProblemById(id: number): Promise<Problem | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;
    return this.mapRowToProblem(rows[0]);
  }

  /**
   * Get problem by Moodle quiz ID
   */
  async getProblemByMoodleQuizId(moodleQuizId: number): Promise<Problem | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM problems WHERE moodle_quiz_id = ?',
      [moodleQuizId]
    );

    if (rows.length === 0) return null;
    return this.mapRowToProblem(rows[0]);
  }

  /**
   * Create new problem
   */
  async createProblem(problemData: Partial<Problem>): Promise<Problem> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO problems (moodle_quiz_id, moodle_question_id, title, description,
       tree_config, problem_type, difficulty_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        problemData.moodle_quiz_id,
        problemData.moodle_question_id || null,
        problemData.title,
        problemData.description || null,
        JSON.stringify(problemData.tree_config),
        problemData.problem_type || ProblemType.PROBABILITY_TREE,
        problemData.difficulty_level || 1
      ]
    );

    const newProblem = await this.getProblemById(result.insertId);
    if (!newProblem) throw new Error('Failed to create problem');
    return newProblem;
  }

  /**
   * Update problem
   */
  async updateProblem(id: number, problemData: Partial<Problem>): Promise<Problem | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (problemData.title !== undefined) {
      updates.push('title = ?');
      values.push(problemData.title);
    }
    if (problemData.description !== undefined) {
      updates.push('description = ?');
      values.push(problemData.description);
    }
    if (problemData.tree_config !== undefined) {
      updates.push('tree_config = ?');
      values.push(JSON.stringify(problemData.tree_config));
    }
    if (problemData.difficulty_level !== undefined) {
      updates.push('difficulty_level = ?');
      values.push(problemData.difficulty_level);
    }

    if (updates.length === 0) return this.getProblemById(id);

    values.push(id);
    await pool.query(
      `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.getProblemById(id);
  }

  /**
   * Delete problem
   */
  async deleteProblem(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM problems WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get tree nodes for problem
   */
  async getTreeNodes(problemId: number): Promise<TreeNode[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tree_nodes WHERE problem_id = ? ORDER BY level, position_x',
      [problemId]
    );

    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  /**
   * Save tree nodes
   */
  async saveTreeNodes(nodes: TreeNode[]): Promise<void> {
    if (nodes.length === 0) return;

    const problemId = nodes[0].problem_id;

    // Delete existing nodes
    await pool.query('DELETE FROM tree_nodes WHERE problem_id = ?', [problemId]);

    // Insert new nodes
    const values = nodes.map(node => [
      node.problem_id,
      node.node_key,
      node.label,
      node.parent_key || null,
      node.probability || null,
      node.value || null,
      node.level,
      node.position_x || null,
      node.position_y || null,
      node.metadata ? JSON.stringify(node.metadata) : null
    ]);

    await pool.query(
      `INSERT INTO tree_nodes
       (problem_id, node_key, label, parent_key, probability, value, level,
        position_x, position_y, metadata)
       VALUES ?`,
      [values]
    );
  }

  /**
   * Map database row to Problem object
   */
  private mapRowToProblem(row: any): Problem {
    return {
      id: row.id,
      moodle_quiz_id: row.moodle_quiz_id,
      moodle_question_id: row.moodle_question_id,
      title: row.title,
      description: row.description,
      tree_config: typeof row.tree_config === 'string'
        ? JSON.parse(row.tree_config)
        : row.tree_config,
      problem_type: row.problem_type,
      difficulty_level: row.difficulty_level,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export default new ProblemService();
