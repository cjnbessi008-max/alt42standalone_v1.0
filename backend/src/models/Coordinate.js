import { query } from '../config/database.js';

class Coordinate {
  // Add single coordinate
  static async add(sessionId, x, y) {
    const sql = `
      INSERT INTO coordinates (session_id, x, y)
      VALUES (?, ?, ?)
    `;
    const result = await query(sql, [sessionId, x, y]);
    return {
      id: result.insertId,
      sessionId,
      x,
      y,
      timestamp: new Date()
    };
  }

  // Add multiple coordinates (batch insert)
  static async addBatch(sessionId, coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return [];
    }

    const values = coordinates.map(coord => [sessionId, coord.x, coord.y]);
    const sql = `
      INSERT INTO coordinates (session_id, x, y)
      VALUES ?
    `;

    // Note: mysql2 doesn't support bulk insert with ?, we need to build query
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');
    const flatValues = values.flat();
    const bulkSql = `INSERT INTO coordinates (session_id, x, y) VALUES ${placeholders}`;

    await query(bulkSql, flatValues);
    return coordinates;
  }

  // Get all coordinates for a session
  static async findBySessionId(sessionId, limit = null, offset = 0) {
    let sql = `
      SELECT id, session_id, x, y, timestamp
      FROM coordinates
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `;

    const params = [sessionId];

    if (limit) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    return await query(sql, params);
  }

  // Get recent coordinates
  static async getRecent(sessionId, count = 50) {
    const sql = `
      SELECT id, session_id, x, y, timestamp
      FROM coordinates
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    const rows = await query(sql, [sessionId, count]);
    return rows.reverse(); // Return in chronological order
  }

  // Get coordinates within time range
  static async findByTimeRange(sessionId, startTime, endTime) {
    const sql = `
      SELECT id, session_id, x, y, timestamp
      FROM coordinates
      WHERE session_id = ?
        AND timestamp >= ?
        AND timestamp <= ?
      ORDER BY timestamp ASC
    `;
    return await query(sql, [sessionId, startTime, endTime]);
  }

  // Count coordinates for a session
  static async count(sessionId) {
    const sql = 'SELECT COUNT(*) as count FROM coordinates WHERE session_id = ?';
    const rows = await query(sql, [sessionId]);
    return rows[0].count;
  }

  // Delete all coordinates for a session
  static async deleteBySessionId(sessionId) {
    const sql = 'DELETE FROM coordinates WHERE session_id = ?';
    await query(sql, [sessionId]);
    return true;
  }

  // Get coordinate statistics (without calculating mean center)
  static async getStats(sessionId) {
    const sql = `
      SELECT
        COUNT(*) as count,
        MIN(x) as min_x,
        MAX(x) as max_x,
        MIN(y) as min_y,
        MAX(y) as max_y,
        MIN(timestamp) as first_point_time,
        MAX(timestamp) as last_point_time
      FROM coordinates
      WHERE session_id = ?
    `;
    const rows = await query(sql, [sessionId]);
    return rows[0] || null;
  }

  // Delete old coordinates (cleanup utility)
  static async deleteOlderThan(days) {
    const sql = `
      DELETE FROM coordinates
      WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const result = await query(sql, [days]);
    return result.affectedRows;
  }
}

export default Coordinate;
