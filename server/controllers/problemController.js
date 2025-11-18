/**
 * Problem Controller
 * 문제 생성 및 관리
 */

const db = require('../models/database');

/**
 * 문제 목록 조회
 */
async function getProblems(req, res) {
  try {
    const {
      limit = 20,
      offset = 0,
      type,
      difficulty,
      isActive = 1
    } = req.query;

    let query = `
      SELECT
        p.*,
        u.username AS created_by_name
      FROM problems p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.is_active = ?
    `;

    const params = [parseInt(isActive)];

    if (type) {
      query += ` AND p.problem_type = ?`;
      params.push(type);
    }

    if (difficulty) {
      query += ` AND p.difficulty_level = ?`;
      params.push(parseInt(difficulty));
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const problems = await db.query(query, params);

    res.json({
      success: true,
      data: {
        problems,
        count: problems.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get problems',
      message: error.message
    });
  }
}

/**
 * 문제 상세 조회
 */
async function getProblemById(req, res) {
  try {
    const { id } = req.params;

    const problem = await db.queryOne(
      `SELECT
        p.*,
        u.username AS created_by_name
       FROM problems p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get problem',
      message: error.message
    });
  }
}

/**
 * 문제 생성
 */
async function createProblem(req, res) {
  try {
    const {
      title,
      description,
      problemType,
      difficultyLevel = 1,
      correctAnswer,
      hints = null,
      maxScore = 100,
      timeLimit = null,
      metadata = null
    } = req.body;

    // 입력 검증
    if (!title || !problemType || !correctAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Title, problem type and correct answer are required'
      });
    }

    const result = await db.query(
      `INSERT INTO problems
       (created_by, title, description, problem_type, difficulty_level,
        correct_answer, hints, max_score, time_limit, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.user.userId,
        title,
        description,
        problemType,
        difficultyLevel,
        correctAnswer,
        hints ? JSON.stringify(hints) : null,
        maxScore,
        timeLimit,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    const problemId = result.insertId;

    // 생성된 문제 조회
    const newProblem = await db.queryOne(
      'SELECT * FROM problems WHERE id = ?',
      [problemId]
    );

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: newProblem
    });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem',
      message: error.message
    });
  }
}

/**
 * 문제 수정
 */
async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      problemType,
      difficultyLevel,
      correctAnswer,
      hints,
      maxScore,
      timeLimit,
      metadata,
      isActive
    } = req.body;

    // 문제 존재 확인
    const problem = await db.queryOne(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // 업데이트 쿼리 동적 생성
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (problemType !== undefined) {
      updates.push('problem_type = ?');
      params.push(problemType);
    }
    if (difficultyLevel !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(difficultyLevel);
    }
    if (correctAnswer !== undefined) {
      updates.push('correct_answer = ?');
      params.push(correctAnswer);
    }
    if (hints !== undefined) {
      updates.push('hints = ?');
      params.push(hints ? JSON.stringify(hints) : null);
    }
    if (maxScore !== undefined) {
      updates.push('max_score = ?');
      params.push(maxScore);
    }
    if (timeLimit !== undefined) {
      updates.push('time_limit = ?');
      params.push(timeLimit);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(metadata ? JSON.stringify(metadata) : null);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // 업데이트된 문제 조회
    const updatedProblem = await db.queryOne(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Problem updated successfully',
      data: updatedProblem
    });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem',
      message: error.message
    });
  }
}

/**
 * 문제 삭제
 */
async function deleteProblem(req, res) {
  try {
    const { id } = req.params;

    // 문제 존재 확인
    const problem = await db.queryOne(
      'SELECT * FROM problems WHERE id = ?',
      [id]
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Soft delete (is_active = 0)
    await db.query(
      'UPDATE problems SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete problem',
      message: error.message
    });
  }
}

module.exports = {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem
};
