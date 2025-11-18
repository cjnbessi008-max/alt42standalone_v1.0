import { query } from '../db/connection.js';

// GET all problems
export const getAllProblems = async (req, res) => {
  try {
    const { category, difficulty, isActive = true } = req.query;

    let sql = `
      SELECT
        p.*,
        u.username as creator_name,
        COUNT(DISTINCT pp.id) as pair_count
      FROM problems p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN problem_pairs pp ON p.id = pp.problem_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (difficulty) {
      sql += ` AND p.difficulty_level = $${paramIndex}`;
      params.push(parseInt(difficulty));
      paramIndex++;
    }

    if (isActive !== undefined) {
      sql += ` AND p.is_active = $${paramIndex}`;
      params.push(isActive === 'true' || isActive === true);
      paramIndex++;
    }

    sql += ' GROUP BY p.id, u.username ORDER BY p.created_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
};

// GET problem by ID
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        p.*,
        u.username as creator_name,
        u.full_name as creator_full_name
      FROM problems p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
};

// GET problem pairs (3D-2D matching pairs)
export const getProblemPairs = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        pp.*,
        s3d.name as shape_3d_name,
        s3d.name_ko as shape_3d_name_ko,
        s3d.model_url as shape_3d_model_url,
        s3d.thumbnail_url as shape_3d_thumbnail_url,
        s2d.name as shape_2d_name,
        s2d.name_ko as shape_2d_name_ko,
        s2d.svg_path as shape_2d_svg_path,
        s2d.image_url as shape_2d_image_url
      FROM problem_pairs pp
      JOIN shapes_3d s3d ON pp.shape_3d_id = s3d.id
      JOIN shapes_2d s2d ON pp.shape_2d_id = s2d.id
      WHERE pp.problem_id = $1
      ORDER BY pp.display_order
    `, [id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching problem pairs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem pairs'
    });
  }
};

// POST create new problem
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      title_ko,
      description,
      description_ko,
      difficulty_level = 1,
      category,
      instructions,
      instructions_ko,
      time_limit_seconds,
      created_by,
      lms_problem_id,
      lms_module_id
    } = req.body;

    if (!title || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Title and creator are required'
      });
    }

    const result = await query(`
      INSERT INTO problems (
        title, title_ko, description, description_ko,
        difficulty_level, category, instructions, instructions_ko,
        time_limit_seconds, created_by, lms_problem_id, lms_module_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, title_ko, description, description_ko,
      difficulty_level, category, instructions, instructions_ko,
      time_limit_seconds, created_by, lms_problem_id, lms_module_id
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem'
    });
  }
};

// PUT update problem
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'title', 'title_ko', 'description', 'description_ko',
      'difficulty_level', 'category', 'instructions', 'instructions_ko',
      'time_limit_seconds', 'is_active'
    ];

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE problems
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem'
    });
  }
};

// DELETE problem
export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      DELETE FROM problems
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete problem'
    });
  }
};
