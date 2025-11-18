import express from 'express';
import { query } from '../services/database.js';

const router = express.Router();

// 특정 활동의 조건 가져오기
router.get('/:activityId', async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);

    if (isNaN(activityId)) {
      return res.status(400).json({ error: { message: '유효하지 않은 활동 ID' } });
    }

    const conditions = await query(
      'SELECT * FROM conditions WHERE activity_id = ? ORDER BY created_at',
      [activityId]
    );

    res.json(conditions);
  } catch (error) {
    next(error);
  }
});

// 조건 저장/업데이트
router.post('/:activityId', async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);
    const { conditions } = req.body;

    if (isNaN(activityId)) {
      return res.status(400).json({ error: { message: '유효하지 않은 활동 ID' } });
    }

    if (!Array.isArray(conditions)) {
      return res.status(400).json({ error: { message: '조건은 배열이어야 합니다' } });
    }

    // 기존 조건 삭제
    await query('DELETE FROM conditions WHERE activity_id = ?', [activityId]);

    // 새 조건 저장
    for (const condition of conditions) {
      await query(
        `INSERT INTO conditions (id, activity_id, type, description, operator, value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          condition.id,
          activityId,
          condition.type,
          condition.description,
          condition.operator || null,
          condition.value || null,
        ]
      );
    }

    res.json({ success: true, message: '조건이 저장되었습니다' });
  } catch (error) {
    next(error);
  }
});

// 조건 삭제
router.delete('/:activityId', async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.activityId);

    if (isNaN(activityId)) {
      return res.status(400).json({ error: { message: '유효하지 않은 활동 ID' } });
    }

    await query('DELETE FROM conditions WHERE activity_id = ?', [activityId]);

    res.json({ success: true, message: '조건이 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
});

export default router;
