const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class StepModel {
  // 새 풀이 단계 추가
  static async create(stepData) {
    const id = uuidv4();
    const query = `
      INSERT INTO solve_steps
      (id, timeline_id, step_number, action_type, from_expression,
       to_expression, rule_applied, rule_category, explanation,
       is_correct, hint_used, duration_ms, user_input, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      id,
      stepData.timeline_id,
      stepData.step_number,
      stepData.action_type,
      stepData.from_expression,
      stepData.to_expression,
      stepData.rule_applied || null,
      stepData.rule_category || null,
      stepData.explanation || null,
      stepData.is_correct !== undefined ? stepData.is_correct : 1,
      stepData.hint_used !== undefined ? stepData.hint_used : 0,
      stepData.duration_ms || 0,
      stepData.user_input || null
    ];

    await db.query(query, values);

    // 타임라인의 total_steps 업데이트
    await db.query(
      'UPDATE solve_timelines SET total_steps = total_steps + 1 WHERE id = ?',
      [stepData.timeline_id]
    );

    return this.findById(id);
  }

  // ID로 단계 조회
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM solve_steps WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // 타임라인 ID로 모든 단계 조회
  static async findByTimelineId(timelineId) {
    const [rows] = await db.query(
      `SELECT * FROM solve_steps
       WHERE timeline_id = ?
       ORDER BY step_number ASC`,
      [timelineId]
    );
    return rows;
  }

  // 특정 단계 번호 조회
  static async findByStepNumber(timelineId, stepNumber) {
    const [rows] = await db.query(
      `SELECT * FROM solve_steps
       WHERE timeline_id = ? AND step_number = ?`,
      [timelineId, stepNumber]
    );
    return rows[0] || null;
  }

  // 단계 수정
  static async update(id, updates) {
    const allowedFields = [
      'action_type', 'from_expression', 'to_expression',
      'rule_applied', 'rule_category', 'explanation',
      'is_correct', 'hint_used', 'duration_ms', 'user_input'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE solve_steps SET ${updateFields.join(', ')} WHERE id = ?`;

    await db.query(query, values);
    return this.findById(id);
  }

  // 단계 삭제
  static async delete(id) {
    const step = await this.findById(id);
    if (!step) {
      return false;
    }

    const [result] = await db.query(
      'DELETE FROM solve_steps WHERE id = ?',
      [id]
    );

    // 타임라인의 total_steps 감소
    if (result.affectedRows > 0) {
      await db.query(
        'UPDATE solve_timelines SET total_steps = total_steps - 1 WHERE id = ?',
        [step.timeline_id]
      );
    }

    return result.affectedRows > 0;
  }

  // 타임라인의 마지막 단계 번호 조회
  static async getLastStepNumber(timelineId) {
    const [rows] = await db.query(
      'SELECT MAX(step_number) as last_step FROM solve_steps WHERE timeline_id = ?',
      [timelineId]
    );
    return rows[0]?.last_step || 0;
  }
}

module.exports = StepModel;
