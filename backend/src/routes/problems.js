import express from 'express'
import { query } from '../db/database.js'

const router = express.Router()

// 모든 문제 가져오기
router.get('/', async (req, res) => {
  try {
    const { shape_type, difficulty, limit = 50 } = req.query

    let sql = 'SELECT * FROM problems WHERE is_active = true'
    const params = []
    let paramCount = 1

    if (shape_type) {
      sql += ` AND shape_type = $${paramCount++}`
      params.push(shape_type)
    }

    if (difficulty) {
      sql += ` AND difficulty = $${paramCount++}`
      params.push(difficulty)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount}`
    params.push(limit)

    const result = await query(sql, params)

    // properties를 도형별 속성으로 변환
    const problems = result.rows.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      shapeType: problem.shape_type,
      summary: problem.summary,
      difficulty: problem.difficulty,
      ...problem.properties, // properties를 펼쳐서 최상위에 추가
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    }))

    res.json(problems)
  } catch (error) {
    console.error('Get problems error:', error)
    res.status(500).json({ error: 'Failed to fetch problems' })
  }
})

// 특정 문제 가져오기
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT * FROM problems WHERE id = $1 AND is_active = true',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' })
    }

    const problem = result.rows[0]
    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      shapeType: problem.shape_type,
      summary: problem.summary,
      difficulty: problem.difficulty,
      ...problem.properties,
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    }

    res.json(response)
  } catch (error) {
    console.error('Get problem error:', error)
    res.status(500).json({ error: 'Failed to fetch problem' })
  }
})

// 랜덤 문제 가져오기
router.get('/random', async (req, res) => {
  try {
    const { shape_type, difficulty } = req.query

    let sql = 'SELECT * FROM problems WHERE is_active = true'
    const params = []
    let paramCount = 1

    if (shape_type) {
      sql += ` AND shape_type = $${paramCount++}`
      params.push(shape_type)
    }

    if (difficulty) {
      sql += ` AND difficulty = $${paramCount++}`
      params.push(difficulty)
    }

    sql += ' ORDER BY RANDOM() LIMIT 1'

    const result = await query(sql, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No problems found' })
    }

    const problem = result.rows[0]
    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      shapeType: problem.shape_type,
      summary: problem.summary,
      difficulty: problem.difficulty,
      ...problem.properties,
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    }

    res.json(response)
  } catch (error) {
    console.error('Get random problem error:', error)
    res.status(500).json({ error: 'Failed to fetch random problem' })
  }
})

// 새 문제 생성
router.post('/', async (req, res) => {
  try {
    const { title, description, shapeType, summary, difficulty, ...properties } = req.body

    // 필수 필드 검증
    if (!title || !shapeType || !summary) {
      return res.status(400).json({
        error: 'Missing required fields: title, shapeType, summary'
      })
    }

    const result = await query(
      `INSERT INTO problems (title, description, shape_type, summary, difficulty, properties)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || '', shapeType, summary, difficulty || 'medium', JSON.stringify(properties)]
    )

    const problem = result.rows[0]
    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      shapeType: problem.shape_type,
      summary: problem.summary,
      difficulty: problem.difficulty,
      ...problem.properties,
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Create problem error:', error)
    res.status(500).json({ error: 'Failed to create problem' })
  }
})

// 문제 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, shapeType, summary, difficulty, ...properties } = req.body

    const result = await query(
      `UPDATE problems
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           shape_type = COALESCE($3, shape_type),
           summary = COALESCE($4, summary),
           difficulty = COALESCE($5, difficulty),
           properties = COALESCE($6, properties)
       WHERE id = $7 AND is_active = true
       RETURNING *`,
      [title, description, shapeType, summary, difficulty, JSON.stringify(properties), id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' })
    }

    const problem = result.rows[0]
    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      shapeType: problem.shape_type,
      summary: problem.summary,
      difficulty: problem.difficulty,
      ...problem.properties,
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    }

    res.json(response)
  } catch (error) {
    console.error('Update problem error:', error)
    res.status(500).json({ error: 'Failed to update problem' })
  }
})

// 문제 삭제 (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await query(
      'UPDATE problems SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' })
    }

    res.json({ message: 'Problem deleted successfully', id: result.rows[0].id })
  } catch (error) {
    console.error('Delete problem error:', error)
    res.status(500).json({ error: 'Failed to delete problem' })
  }
})

// 통계 정보
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await query('SELECT * FROM problem_statistics')
    res.json(result.rows)
  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
