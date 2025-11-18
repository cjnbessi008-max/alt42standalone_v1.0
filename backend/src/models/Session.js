import { query } from '../config/database.js';

class Session {
  // Create new session
  static async create(sessionData) {
    const {
      sessionId,
      studentId,
      studentName,
      problemId,
      problemTitle,
      canvasWidth = 800,
      canvasHeight = 600
    } = sessionData;

    const sql = `
      INSERT INTO sessions
      (session_id, student_id, student_name, problem_id, problem_title, canvas_width, canvas_height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      sessionId,
      studentId,
      studentName,
      problemId,
      problemTitle,
      canvasWidth,
      canvasHeight
    ]);

    return this.findBySessionId(sessionId);
  }

  // Find session by session_id
  static async findBySessionId(sessionId) {
    const sql = 'SELECT * FROM sessions WHERE session_id = ? LIMIT 1';
    const rows = await query(sql, [sessionId]);
    return rows[0] || null;
  }

  // Find all sessions for a student
  static async findByStudentId(studentId) {
    const sql = `
      SELECT * FROM sessions
      WHERE student_id = ?
      ORDER BY created_at DESC
    `;
    return await query(sql, [studentId]);
  }

  // Get active session for student
  static async getActiveSession(studentId) {
    const sql = `
      SELECT * FROM sessions
      WHERE student_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const rows = await query(sql, [studentId]);
    return rows[0] || null;
  }

  // End session
  static async endSession(sessionId) {
    const sql = `
      UPDATE sessions
      SET is_active = FALSE, ended_at = NOW()
      WHERE session_id = ?
    `;
    await query(sql, [sessionId]);
    return this.findBySessionId(sessionId);
  }

  // Update session
  static async update(sessionId, updates) {
    const allowedFields = ['student_name', 'problem_title', 'canvas_width', 'canvas_height'];
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return this.findBySessionId(sessionId);
    }

    values.push(sessionId);
    const sql = `UPDATE sessions SET ${fields.join(', ')} WHERE session_id = ?`;
    await query(sql, values);

    return this.findBySessionId(sessionId);
  }

  // Get session summary with stats
  static async getSummary(sessionId) {
    const sql = 'SELECT * FROM session_summary WHERE session_id = ? LIMIT 1';
    const rows = await query(sql, [sessionId]);
    return rows[0] || null;
  }

  // Get all active sessions
  static async getActiveSessions() {
    const sql = 'SELECT * FROM sessions WHERE is_active = TRUE ORDER BY created_at DESC';
    return await query(sql);
  }

  // Delete session (cascade will delete coordinates and stats)
  static async delete(sessionId) {
    const sql = 'DELETE FROM sessions WHERE session_id = ?';
    await query(sql, [sessionId]);
    return true;
  }
}

export default Session;
