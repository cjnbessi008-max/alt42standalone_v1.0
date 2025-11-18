import express from 'express';
import { query } from '../services/database.js';

const router = express.Router();

// 스캔 기록 저장
router.post('/', async (req, res, next) => {
  try {
    const { activityId, scanData, timestamp } = req.body;

    if (!activityId || !scanData) {
      return res.status(400).json({
        error: { message: 'activityId와 scanData는 필수입니다' },
      });
    }

    const result = await query(
      'INSERT INTO scan_history (activity_id, scan_data, timestamp) VALUES (?, ?, ?)',
      [activityId, JSON.stringify(scanData), timestamp || new Date()]
    );

    res.json({
      success: true,
      message: '스캔 기록이 저장되었습니다',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// 특정 활동의 스캔 기록 가져오기
router.get('/activity/:activityId', async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);

    if (isNaN(activityId)) {
      return res.status(400).json({ error: { message: '유효하지 않은 활동 ID' } });
    }

    const history = await query(
      'SELECT * FROM scan_history WHERE activity_id = ? ORDER BY timestamp DESC',
      [activityId]
    );

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// 모든 스캔 기록 가져오기
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await query(
      'SELECT * FROM scan_history ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// 스캔 기록 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: { message: '유효하지 않은 ID' } });
    }

    await query('DELETE FROM scan_history WHERE id = ?', [id]);

    res.json({ success: true, message: '스캔 기록이 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
});

export default router;
