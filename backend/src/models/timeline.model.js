const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TimelineModel {
  // 새 타임라인 생성
  static async create(timelineData) {
    const id = uuidv4();
    const query = `
      INSERT INTO solve_timelines
      (id, student_id, student_name, module_id, problem_id, equation,
       initial_equation, difficulty_level, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      id,
      timelineData.student_id,
      timelineData.student_name || null,
      timelineData.module_id || null,
      timelineData.problem_id || null,
      timelineData.equation,
      timelineData.initial_equation,
      timelineData.difficulty_level || 'medium'
    ];

    await db.query(query, values);
    return this.findById(id);
  }

  // ID로 타임라인 조회
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM solve_timelines WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // 학생 ID로 타임라인 목록 조회
  static async findByStudentId(studentId, limit = 20, offset = 0) {
    const [rows] = await db.query(
      `SELECT * FROM solve_timelines
       WHERE student_id = ?
       ORDER BY started_at DESC
       LIMIT ? OFFSET ?`,
      [studentId, limit, offset]
    );
    return rows;
  }

  // 타임라인 업데이트
  static async update(id, updates) {
    const allowedFields = [
      'final_answer', 'completed_at', 'is_correct',
      'total_steps', 'time_spent_seconds'
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
    const query = `
      UPDATE solve_timelines
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(query, values);
    return this.findById(id);
  }

  // 타임라인 완료 처리
  static async complete(id, finalAnswer, isCorrect) {
    const timeline = await this.findById(id);
    if (!timeline) {
      throw new Error('Timeline not found');
    }

    // 전체 소요 시간 계산
    const timeSpent = Math.floor(
      (new Date() - new Date(timeline.started_at)) / 1000
    );

    return this.update(id, {
      final_answer: finalAnswer,
      completed_at: new Date(),
      is_correct: isCorrect ? 1 : 0,
      time_spent_seconds: timeSpent
    });
  }

  // 타임라인 삭제
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM solve_timelines WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // 통계 조회
  static async getStatsByStudentId(studentId) {
    const [stats] = await db.query(
      `SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(total_steps) as avg_steps,
        AVG(time_spent_seconds) as avg_time,
        ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM solve_timelines
      WHERE student_id = ? AND completed_at IS NOT NULL`,
      [studentId]
    );
    return stats[0] || null;
  }
}

module.exports = TimelineModel;
