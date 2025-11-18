/**
 * Problem Model
 * Unfolding Net 문제 데이터 모델
 */

import { executeQuery } from '../config/database.js';

/**
 * 문제 데이터 구조
 *
 * CREATE TABLE IF NOT EXISTS unfolding_problems (
 *   id VARCHAR(36) PRIMARY KEY,
 *   course_id VARCHAR(36) NOT NULL,
 *   module_id VARCHAR(36) NOT NULL,
 *   type ENUM('cube', 'tetrahedron', 'octahedron', 'pyramid', 'prism') NOT NULL,
 *   difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
 *   title VARCHAR(255) NOT NULL,
 *   description TEXT,
 *   config JSON,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   INDEX idx_course_module (course_id, module_id)
 * );
 */

export class ProblemModel {
  /**
   * 문제 ID로 조회
   */
  static async findById(problemId) {
    const query = `
      SELECT id, course_id, module_id, type, difficulty,
             title, description, config, created_at
      FROM unfolding_problems
      WHERE id = ?
    `;

    const results = await executeQuery(query, [problemId]);
    return results[0] || null;
  }

  /**
   * 코스와 모듈로 문제 조회
   */
  static async findByModuleId(courseId, moduleId) {
    const query = `
      SELECT id, course_id, module_id, type, difficulty,
             title, description, config, created_at
      FROM unfolding_problems
      WHERE course_id = ? AND module_id = ?
      LIMIT 1
    `;

    const results = await executeQuery(query, [courseId, moduleId]);
    return results[0] || null;
  }

  /**
   * 코스의 모든 문제 조회
   */
  static async findByCourseId(courseId) {
    const query = `
      SELECT id, course_id, module_id, type, difficulty,
             title, description, config, created_at
      FROM unfolding_problems
      WHERE course_id = ?
      ORDER BY difficulty ASC, created_at DESC
    `;

    const results = await executeQuery(query, [courseId]);
    return results;
  }

  /**
   * 새 문제 생성
   */
  static async create(problemData) {
    const query = `
      INSERT INTO unfolding_problems
      (id, course_id, module_id, type, difficulty, title, description, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      problemData.id,
      problemData.courseId,
      problemData.moduleId,
      problemData.type,
      problemData.difficulty,
      problemData.title,
      problemData.description,
      JSON.stringify(problemData.config || {}),
    ];

    await executeQuery(query, params);
    return await this.findById(problemData.id);
  }

  /**
   * 문제 업데이트
   */
  static async update(problemId, updateData) {
    const fields = [];
    const params = [];

    if (updateData.type) {
      fields.push('type = ?');
      params.push(updateData.type);
    }

    if (updateData.difficulty) {
      fields.push('difficulty = ?');
      params.push(updateData.difficulty);
    }

    if (updateData.title) {
      fields.push('title = ?');
      params.push(updateData.title);
    }

    if (updateData.description) {
      fields.push('description = ?');
      params.push(updateData.description);
    }

    if (updateData.config) {
      fields.push('config = ?');
      params.push(JSON.stringify(updateData.config));
    }

    if (fields.length === 0) {
      return await this.findById(problemId);
    }

    params.push(problemId);

    const query = `
      UPDATE unfolding_problems
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, params);
    return await this.findById(problemId);
  }

  /**
   * 문제 삭제
   */
  static async delete(problemId) {
    const query = 'DELETE FROM unfolding_problems WHERE id = ?';
    await executeQuery(query, [problemId]);
    return true;
  }
}

export default ProblemModel;
