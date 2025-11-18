import { query } from '../db/connection.js';

// POST sync with LMS (Moodle)
export const syncWithLMS = async (req, res) => {
  try {
    const { lms_id } = req.body;

    // Check if LMS integration is enabled
    if (process.env.LMS_INTEGRATION_ENABLED !== 'true') {
      return res.status(503).json({
        success: false,
        error: 'LMS integration is not enabled',
        message: 'This feature will be available in Phase 3'
      });
    }

    // Get LMS configuration
    const lmsConfig = await query(`
      SELECT * FROM lms_integrations
      WHERE id = $1 AND is_active = true
    `, [lms_id]);

    if (lmsConfig.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LMS integration not found or inactive'
      });
    }

    // TODO: Implement actual LMS sync logic
    // This would involve:
    // 1. Connecting to Moodle API
    // 2. Fetching course/module data
    // 3. Syncing problems and users
    // 4. Updating sync status

    await query(`
      UPDATE lms_integrations
      SET last_sync_at = CURRENT_TIMESTAMP,
          sync_status = 'success'
      WHERE id = $1
    `, [lms_id]);

    res.json({
      success: true,
      message: 'LMS sync initiated',
      note: 'Full LMS integration coming in Phase 3'
    });
  } catch (error) {
    console.error('Error syncing with LMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync with LMS'
    });
  }
};

// GET problems from LMS module
export const getProblemsFromLMS = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (process.env.LMS_INTEGRATION_ENABLED !== 'true') {
      return res.status(503).json({
        success: false,
        error: 'LMS integration is not enabled'
      });
    }

    // Get problems associated with LMS module
    const result = await query(`
      SELECT
        p.*,
        COUNT(DISTINCT pp.id) as pair_count
      FROM problems p
      LEFT JOIN problem_pairs pp ON p.id = pp.problem_id
      WHERE p.lms_module_id = $1 AND p.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [moduleId]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching LMS problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems from LMS'
    });
  }
};

// POST configure LMS integration
export const configureLMS = async (req, res) => {
  try {
    const {
      lms_type = 'moodle',
      lms_url,
      lms_api_key,
      consumer_key,
      shared_secret,
      course_id,
      config
    } = req.body;

    if (!lms_url) {
      return res.status(400).json({
        success: false,
        error: 'LMS URL is required'
      });
    }

    const result = await query(`
      INSERT INTO lms_integrations (
        lms_type, lms_url, lms_api_key,
        consumer_key, shared_secret, course_id,
        config, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [
      lms_type, lms_url, lms_api_key,
      consumer_key, shared_secret, course_id,
      JSON.stringify(config)
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'LMS integration configured successfully'
    });
  } catch (error) {
    console.error('Error configuring LMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure LMS integration'
    });
  }
};

// GET LMS integration status
export const getLMSStatus = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id, lms_type, lms_url, course_id,
        is_active, last_sync_at, sync_status,
        created_at, updated_at
      FROM lms_integrations
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      enabled: process.env.LMS_INTEGRATION_ENABLED === 'true',
      integrations: result.rows,
      note: 'Full Moodle LTI integration will be available in Phase 3'
    });
  } catch (error) {
    console.error('Error fetching LMS status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LMS status'
    });
  }
};
