import { query } from '../config/database.js';

const PIPELINE_STAGES = [
  'world_model',
  'rule_engine',
  'data_manager',
  'input_strategy',
  'ui_generator',
  'deployer'
];

export const getCaseRoadmap = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    // Get module information with all pipeline stages
    const moduleResult = await query(
      `SELECT id, name, description, teacher_request, status, created_at
       FROM modules
       WHERE id = $1`,
      [moduleId]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Module not found' } });
    }

    const module = moduleResult.rows[0];

    // Get all generation jobs for this module
    const jobsResult = await query(
      `SELECT stage, status, started_at, completed_at, error_log,
              EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
       FROM generation_jobs
       WHERE module_id = $1
       ORDER BY started_at`,
      [moduleId]
    );

    // Build roadmap structure
    const roadmap = {
      moduleId: module.id,
      moduleName: module.name,
      teacherRequest: module.teacher_request,
      overallStatus: module.status,
      createdAt: module.created_at,
      stages: PIPELINE_STAGES.map(stageName => {
        const job = jobsResult.rows.find(j => j.stage === stageName);
        return {
          name: stageName,
          displayName: getStageDisplayName(stageName),
          status: job?.status || 'pending',
          startedAt: job?.started_at || null,
          completedAt: job?.completed_at || null,
          durationSeconds: job?.duration_seconds || null,
          errorLog: job?.error_log || null
        };
      }),
      dependencies: getStageDependencies()
    };

    res.json(roadmap);
  } catch (error) {
    next(error);
  }
};

export const getPipelineProgress = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) as total_stages,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'completed')::FLOAT /
           NULLIF(COUNT(*)::FLOAT, 0)) * 100,
          2
        ) as progress_percentage
       FROM generation_jobs
       WHERE module_id = $1`,
      [moduleId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const completePipelineStage = async (req, res, next) => {
  try {
    const { moduleId, stage } = req.params;
    const { outputData, error } = req.body;

    if (!PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ error: { message: 'Invalid pipeline stage' } });
    }

    const status = error ? 'failed' : 'completed';

    // Update current stage
    const result = await query(
      `UPDATE generation_jobs
       SET status = $1,
           completed_at = NOW(),
           output_data = $2,
           error_log = $3
       WHERE module_id = $4 AND stage = $5
       RETURNING *`,
      [status, outputData ? JSON.stringify(outputData) : null, error, moduleId, stage]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Generation job not found' } });
    }

    // If completed successfully, create next stage job
    if (!error) {
      const currentIndex = PIPELINE_STAGES.indexOf(stage);
      if (currentIndex < PIPELINE_STAGES.length - 1) {
        const nextStage = PIPELINE_STAGES[currentIndex + 1];
        await query(
          `INSERT INTO generation_jobs (module_id, stage, status, input_data)
           VALUES ($1, $2, 'pending', $3)`,
          [moduleId, nextStage, JSON.stringify({ previousStageOutput: outputData })]
        );
      } else {
        // All stages complete, update module status
        await query(
          `UPDATE modules SET status = 'active', updated_at = NOW() WHERE id = $1`,
          [moduleId]
        );
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('pipeline:stage-completed', {
      moduleId,
      stage,
      status,
      job: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getAllActiveCases = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.id, m.name, m.status, m.created_at,
              COUNT(gj.id) FILTER (WHERE gj.status = 'completed') as completed_stages,
              COUNT(gj.id) as total_stages
       FROM modules m
       LEFT JOIN generation_jobs gj ON m.id = gj.module_id
       WHERE m.status IN ('generating', 'pending')
       GROUP BY m.id
       ORDER BY m.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getStageDisplayName(stageName) {
  const displayNames = {
    world_model: '세계관 재구성',
    rule_engine: '룰 생성 엔진',
    data_manager: '데이터 관리',
    input_strategy: '입력 전략 설계',
    ui_generator: 'UI 자동 생성',
    deployer: '배포 및 통합'
  };
  return displayNames[stageName] || stageName;
}

function getStageDependencies() {
  return [
    { from: 'world_model', to: 'rule_engine' },
    { from: 'rule_engine', to: 'data_manager' },
    { from: 'data_manager', to: 'input_strategy' },
    { from: 'input_strategy', to: 'ui_generator' },
    { from: 'ui_generator', to: 'deployer' }
  ];
}
