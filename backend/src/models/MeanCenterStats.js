import { query, callProcedure } from '../config/database.js';

class MeanCenterStats {
  // Calculate and save mean center statistics using stored procedure
  static async calculate(sessionId) {
    try {
      await callProcedure('CalculateMeanCenter', [sessionId]);
      return this.findBySessionId(sessionId);
    } catch (error) {
      console.error('Error calculating mean center:', error);
      throw error;
    }
  }

  // Manual calculation (alternative to stored procedure)
  static async calculateManual(sessionId) {
    // Get all coordinates
    const coordSql = 'SELECT x, y FROM coordinates WHERE session_id = ?';
    const coordinates = await query(coordSql, [sessionId]);

    if (coordinates.length === 0) {
      return null;
    }

    const n = coordinates.length;

    // Calculate mean
    const meanX = coordinates.reduce((sum, c) => sum + parseFloat(c.x), 0) / n;
    const meanY = coordinates.reduce((sum, c) => sum + parseFloat(c.y), 0) / n;

    // Calculate variance
    const varianceX = coordinates.reduce(
      (sum, c) => sum + Math.pow(parseFloat(c.x) - meanX, 2),
      0
    ) / n;
    const varianceY = coordinates.reduce(
      (sum, c) => sum + Math.pow(parseFloat(c.y) - meanY, 2),
      0
    ) / n;

    // Calculate standard deviation
    const stdDevX = Math.sqrt(varianceX);
    const stdDevY = Math.sqrt(varianceY);

    // Get min/max
    const minX = Math.min(...coordinates.map(c => parseFloat(c.x)));
    const maxX = Math.max(...coordinates.map(c => parseFloat(c.x)));
    const minY = Math.min(...coordinates.map(c => parseFloat(c.y)));
    const maxY = Math.max(...coordinates.map(c => parseFloat(c.y)));

    // Save to database
    const sql = `
      INSERT INTO mean_center_stats
      (session_id, mean_x, mean_y, point_count, variance_x, variance_y,
       std_dev_x, std_dev_y, min_x, max_x, min_y, max_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mean_x = VALUES(mean_x),
        mean_y = VALUES(mean_y),
        point_count = VALUES(point_count),
        variance_x = VALUES(variance_x),
        variance_y = VALUES(variance_y),
        std_dev_x = VALUES(std_dev_x),
        std_dev_y = VALUES(std_dev_y),
        min_x = VALUES(min_x),
        max_x = VALUES(max_x),
        min_y = VALUES(min_y),
        max_y = VALUES(max_y),
        calculated_at = NOW()
    `;

    await query(sql, [
      sessionId, meanX, meanY, n,
      varianceX, varianceY,
      stdDevX, stdDevY,
      minX, maxX, minY, maxY
    ]);

    return this.findBySessionId(sessionId);
  }

  // Get mean center stats for a session
  static async findBySessionId(sessionId) {
    const sql = 'SELECT * FROM mean_center_stats WHERE session_id = ? ORDER BY calculated_at DESC LIMIT 1';
    const rows = await query(sql, [sessionId]);
    return rows[0] || null;
  }

  // Get incremental mean center (efficient for real-time updates)
  static async getIncremental(sessionId, newX, newY) {
    const current = await this.findBySessionId(sessionId);

    if (!current) {
      // First point
      return {
        meanX: newX,
        meanY: newY,
        pointCount: 1
      };
    }

    const n = current.point_count;
    const newMeanX = (current.mean_x * n + newX) / (n + 1);
    const newMeanY = (current.mean_y * n + newY) / (n + 1);

    return {
      meanX: newMeanX,
      meanY: newMeanY,
      pointCount: n + 1,
      previousMeanX: current.mean_x,
      previousMeanY: current.mean_y
    };
  }

  // Delete stats for a session
  static async delete(sessionId) {
    const sql = 'DELETE FROM mean_center_stats WHERE session_id = ?';
    await query(sql, [sessionId]);
    return true;
  }

  // Get all stats with pagination
  static async getAll(limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM mean_center_stats
      ORDER BY calculated_at DESC
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [limit, offset]);
  }
}

export default MeanCenterStats;
