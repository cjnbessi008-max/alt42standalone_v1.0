/**
 * 문제 관리 라우트
 * /api/problems
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/problems
 * 문제 목록 조회
 */
router.get('/', async (req, res, next) => {
  try {
    const problems = await query(
      'SELECT * FROM problems ORDER BY created_at DESC'
    );

    // JSON 파싱
    const parsedProblems = problems.map(problem => ({
      ...problem,
      original_shape: JSON.parse(problem.original_shape)
    }));

    res.json({
      success: true,
      data: parsedProblems
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/problems/:id
 * 특정 문제 조회
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const problems = await query(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (problems.length === 0) {
      return res.status(404).json({
        success: false,
        error: '문제를 찾을 수 없습니다.'
      });
    }

    const problem = {
      ...problems[0],
      original_shape: JSON.parse(problems[0].original_shape)
    };

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/problems
 * 새 문제 생성
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      moodle_id,
      title,
      description,
      original_shape,
      scale_range_min,
      scale_range_max
    } = req.body;

    const result = await query(
      `INSERT INTO problems
       (moodle_id, title, description, original_shape, scale_range_min, scale_range_max)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        moodle_id,
        title,
        description,
        JSON.stringify(original_shape),
        scale_range_min || 0.5,
        scale_range_max || 3.0
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: '문제가 생성되었습니다.'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/problems/:id
 * 문제 수정
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      original_shape,
      scale_range_min,
      scale_range_max
    } = req.body;

    await query(
      `UPDATE problems
       SET title = ?, description = ?, original_shape = ?,
           scale_range_min = ?, scale_range_max = ?
       WHERE id = ?`,
      [
        title,
        description,
        JSON.stringify(original_shape),
        scale_range_min,
        scale_range_max,
        id
      ]
    );

    res.json({
      success: true,
      data: {
        message: '문제가 수정되었습니다.'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/problems/:id
 * 문제 삭제
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM problems WHERE id = ?', [id]);

    res.json({
      success: true,
      data: {
        message: '문제가 삭제되었습니다.'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
