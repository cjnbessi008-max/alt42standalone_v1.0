import { query } from '../config/database.js';

export const getAllModules = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'stage', gj.stage,
              'status', gj.status,
              'started_at', gj.started_at,
              'completed_at', gj.completed_at
            ) ORDER BY gj.started_at
          ) FILTER (WHERE gj.id IS NOT NULL),
          '[]'
        ) as pipeline_progress
      FROM modules m
      LEFT JOIN generation_jobs gj ON m.id = gj.module_id
      GROUP BY m.id
      ORDER BY m.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT m.*,
        json_agg(
          json_build_object(
            'stage', gj.stage,
            'status', gj.status,
            'started_at', gj.started_at,
            'completed_at', gj.completed_at,
            'output_data', gj.output_data
          ) ORDER BY gj.started_at
        ) as pipeline_progress
      FROM modules m
      LEFT JOIN generation_jobs gj ON m.id = gj.module_id
      WHERE m.id = $1
      GROUP BY m.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Module not found' } });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createModule = async (req, res, next) => {
  try {
    const { name, description, subject, grade_level, teacher_request } = req.body;

    const result = await query(
      `INSERT INTO modules (name, description, subject, grade_level, teacher_request, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [name, description, subject || 'mathematics', grade_level, teacher_request]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, grade_level, status } = req.body;

    const result = await query(
      `UPDATE modules
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           grade_level = COALESCE($3, grade_level),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, grade_level, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Module not found' } });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM modules WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Module not found' } });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const startGeneration = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update module status to generating
    await query(
      `UPDATE modules SET status = 'generating', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Create initial generation job for world_model stage
    const result = await query(
      `INSERT INTO generation_jobs (module_id, stage, status, input_data)
       VALUES ($1, 'world_model', 'pending', $2)
       RETURNING *`,
      [id, JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    // Emit socket event
    const io = req.app.get('io');
    io.emit('generation:started', { moduleId: id, jobId: result.rows[0].id });

    res.json({
      message: 'Generation started',
      job: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getGenerationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT stage, status, started_at, completed_at, error_log
       FROM generation_jobs
       WHERE module_id = $1
       ORDER BY started_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
