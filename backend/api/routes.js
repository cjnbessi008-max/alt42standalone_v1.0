import express from 'express';
import { query, transaction } from '../config/database.js';
import moodleClient from '../moodle/client.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// =============================================
// Health Check
// =============================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Counting Tree Map API'
  });
});

// =============================================
// Moodle Integration Routes
// =============================================

/**
 * POST /api/moodle/launch
 * LTI launch endpoint - receives problem data from Moodle
 */
router.post('/moodle/launch', async (req, res) => {
  try {
    const {
      moodle_problem_id,
      moodle_course_id,
      moodle_user_id,
      question_text,
      problem_type = 'counting',
      difficulty_level = 3
    } = req.body;

    // Validate required fields
    if (!moodle_problem_id || !question_text || !moodle_user_id) {
      return res.status(400).json({
        error: 'Missing required fields: moodle_problem_id, question_text, moodle_user_id'
      });
    }

    // Check if problem already exists
    let problem = await query(
      'SELECT * FROM problems WHERE moodle_problem_id = ?',
      [moodle_problem_id]
    );

    let problemId;

    if (problem.length === 0) {
      // Create new problem
      problemId = uuidv4();
      await query(
        `INSERT INTO problems (id, moodle_problem_id, moodle_course_id, question_text, problem_type, difficulty_level)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [problemId, moodle_problem_id, moodle_course_id, question_text, problem_type, difficulty_level]
      );
    } else {
      problemId = problem[0].id;
    }

    // Create student session
    const sessionId = uuidv4();
    await query(
      `INSERT INTO student_sessions (id, student_id, moodle_user_id, problem_id)
       VALUES (?, ?, ?, ?)`,
      [sessionId, `student_${moodle_user_id}`, moodle_user_id, problemId]
    );

    res.json({
      success: true,
      problem_id: problemId,
      session_id: sessionId,
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('Moodle launch error:', error);
    res.status(500).json({
      error: 'Failed to process Moodle launch',
      details: error.message
    });
  }
});

/**
 * GET /api/moodle/problem/:moodleProblemId
 * Get problem data from Moodle
 */
router.get('/moodle/problem/:moodleProblemId', async (req, res) => {
  try {
    const { moodleProblemId } = req.params;

    // Try to get from our database first
    const problem = await query(
      'SELECT * FROM problems WHERE moodle_problem_id = ?',
      [moodleProblemId]
    );

    if (problem.length > 0) {
      return res.json(problem[0]);
    }

    // If not found, fetch from Moodle (requires custom implementation)
    const moodleQuestion = await moodleClient.getQuestion(moodleProblemId);

    res.json({
      moodle_data: moodleQuestion,
      message: 'Fetched from Moodle'
    });

  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      error: 'Failed to retrieve problem',
      details: error.message
    });
  }
});

// =============================================
// Problem Routes
// =============================================

/**
 * GET /api/problems
 * List all problems
 */
router.get('/problems', async (req, res) => {
  try {
    const problems = await query('SELECT * FROM problems ORDER BY created_at DESC');
    res.json(problems);
  } catch (error) {
    console.error('List problems error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/problems/:id
 * Get specific problem with tree nodes
 */
router.get('/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await query('SELECT * FROM problems WHERE id = ?', [id]);
    if (problem.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const nodes = await query(
      'SELECT * FROM tree_nodes WHERE problem_id = ? ORDER BY created_at',
      [id]
    );

    res.json({
      problem: problem[0],
      tree_nodes: nodes
    });

  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/problems
 * Create a new problem
 */
router.post('/problems', async (req, res) => {
  try {
    const {
      moodle_problem_id,
      moodle_course_id,
      question_text,
      problem_type = 'counting',
      difficulty_level = 3,
      correct_answer,
      hints,
      learning_objectives
    } = req.body;

    const problemId = uuidv4();

    await query(
      `INSERT INTO problems (id, moodle_problem_id, moodle_course_id, question_text,
       problem_type, difficulty_level, correct_answer, hints, learning_objectives)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        problemId,
        moodle_problem_id || `manual_${Date.now()}`,
        moodle_course_id,
        question_text,
        problem_type,
        difficulty_level,
        JSON.stringify(correct_answer),
        JSON.stringify(hints),
        JSON.stringify(learning_objectives)
      ]
    );

    res.status(201).json({
      success: true,
      problem_id: problemId
    });

  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// Tree Node Routes
// =============================================

/**
 * GET /api/tree/:problemId
 * Get tree structure for a problem
 */
router.get('/tree/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;

    const nodes = await query(
      'SELECT * FROM tree_nodes WHERE problem_id = ?',
      [problemId]
    );

    // Build tree structure
    const tree = buildTreeStructure(nodes);

    res.json({
      problem_id: problemId,
      tree,
      nodes
    });

  } catch (error) {
    console.error('Get tree error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tree/node
 * Add a node to the tree
 */
router.post('/tree/node', async (req, res) => {
  try {
    const {
      problem_id,
      parent_id,
      node_type,
      label,
      description,
      position_x,
      position_y,
      is_correct,
      metadata
    } = req.body;

    const nodeId = uuidv4();

    await query(
      `INSERT INTO tree_nodes (id, problem_id, parent_id, node_type, label, description,
       position_x, position_y, is_correct, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nodeId,
        problem_id,
        parent_id || null,
        node_type,
        label,
        description || null,
        position_x || 0,
        position_y || 0,
        is_correct,
        JSON.stringify(metadata || {})
      ]
    );

    res.status(201).json({
      success: true,
      node_id: nodeId
    });

  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// Student Session Routes
// =============================================

/**
 * POST /api/session/path
 * Record student's path through the tree
 */
router.post('/session/path', async (req, res) => {
  try {
    const {
      session_id,
      node_id,
      sequence_order,
      time_spent,
      student_input,
      feedback_given
    } = req.body;

    const pathId = uuidv4();

    await query(
      `INSERT INTO student_paths (id, session_id, node_id, sequence_order, time_spent, student_input, feedback_given)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pathId,
        session_id,
        node_id,
        sequence_order,
        time_spent || 0,
        JSON.stringify(student_input || {}),
        feedback_given || null
      ]
    );

    res.status(201).json({
      success: true,
      path_id: pathId
    });

  } catch (error) {
    console.error('Record path error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/session/:sessionId/progress
 * Get student's progress in current session
 */
router.get('/session/:sessionId/progress', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await query(
      'SELECT * FROM student_sessions WHERE id = ?',
      [sessionId]
    );

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const paths = await query(
      `SELECT sp.*, tn.label, tn.node_type, tn.is_correct
       FROM student_paths sp
       JOIN tree_nodes tn ON sp.node_id = tn.id
       WHERE sp.session_id = ?
       ORDER BY sp.sequence_order`,
      [sessionId]
    );

    res.json({
      session: session[0],
      path_taken: paths
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/session/:sessionId/complete
 * Mark session as complete and submit grade
 */
router.put('/session/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { final_score } = req.body;

    // Update session
    await query(
      `UPDATE student_sessions
       SET is_active = FALSE, session_end = NOW(), final_score = ?
       WHERE id = ?`,
      [final_score, sessionId]
    );

    // Get session info for grade submission
    const session = await query(
      'SELECT * FROM student_sessions WHERE id = ?',
      [sessionId]
    );

    if (session.length > 0 && session[0].moodle_user_id) {
      // Submit grade back to Moodle (if configured)
      try {
        await moodleClient.submitGrade(
          session[0].moodle_user_id,
          session[0].problem_id,
          final_score
        );
      } catch (moodleError) {
        console.warn('Grade submission to Moodle failed:', moodleError.message);
      }
    }

    res.json({
      success: true,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// Analytics Routes
// =============================================

/**
 * GET /api/analytics/:problemId
 * Get analytics for a problem
 */
router.get('/analytics/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;

    const analytics = await query(
      'SELECT * FROM analytics WHERE problem_id = ?',
      [problemId]
    );

    if (analytics.length === 0) {
      // Calculate analytics if not cached
      const calculated = await calculateAnalytics(problemId);
      return res.json(calculated);
    }

    res.json(analytics[0]);

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// Helper Functions
// =============================================

/**
 * Build hierarchical tree structure from flat node list
 */
function buildTreeStructure(nodes) {
  const nodeMap = new Map();
  const roots = [];

  // Create node map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Build tree
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.id);
    if (node.parent_id === null) {
      roots.push(treeNode);
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(treeNode);
      }
    }
  });

  return roots;
}

/**
 * Calculate analytics for a problem
 */
async function calculateAnalytics(problemId) {
  const sessions = await query(
    `SELECT COUNT(*) as total, AVG(final_score) as avg_score, AVG(time_spent) as avg_time
     FROM student_sessions
     WHERE problem_id = ? AND is_active = FALSE`,
    [problemId]
  );

  return {
    problem_id: problemId,
    total_attempts: sessions[0].total || 0,
    success_rate: sessions[0].avg_score || 0,
    avg_time_spent: sessions[0].avg_time || 0
  };
}

export default router;
