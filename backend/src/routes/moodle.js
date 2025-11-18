import express from 'express';
import {
  getActivities,
  parseAvailability,
  testMoodleConnection,
} from '../services/moodle.js';
import { query } from '../services/database.js';

const router = express.Router();

// Moodle 연결 테스트
router.get('/test', async (req, res, next) => {
  try {
    const result = await testMoodleConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 코스의 활동 목록 가져오기
router.get('/activities/:courseId', async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId);

    if (isNaN(courseId) || courseId < 1) {
      return res.status(400).json({ error: { message: '유효하지 않은 코스 ID' } });
    }

    // Moodle에서 활동 가져오기
    const activities = await getActivities(courseId);

    // 조건 파싱 및 데이터베이스에 저장
    const processedActivities = [];

    for (const activity of activities) {
      const conditions = parseAvailability(activity.availability);

      // 활동 저장/업데이트
      await query(
        `INSERT INTO activities (id, name, modulename, course_id, availability)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         modulename = VALUES(modulename),
         availability = VALUES(availability),
         updated_at = CURRENT_TIMESTAMP`,
        [activity.id, activity.name, activity.modulename, courseId, activity.availability]
      );

      // 기존 조건 삭제
      await query('DELETE FROM conditions WHERE activity_id = ?', [activity.id]);

      // 새 조건 저장
      if (conditions.length > 0) {
        for (const condition of conditions) {
          await query(
            `INSERT INTO conditions (id, activity_id, type, description, operator, value)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              condition.id,
              activity.id,
              condition.type,
              condition.description,
              condition.operator || null,
              condition.value || null,
            ]
          );
        }
      }

      processedActivities.push({
        ...activity,
        conditions,
      });
    }

    res.json(processedActivities);
  } catch (error) {
    next(error);
  }
});

export default router;
