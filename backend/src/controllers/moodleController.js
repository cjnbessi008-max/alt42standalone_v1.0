const moodleService = require('../services/moodleService');
const Problem = require('../models/Problem');

/**
 * Sync problem from Moodle
 */
exports.syncProblem = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Fetch from Moodle
    const problemData = await moodleService.syncProblem(questionId);

    // Check if already exists
    const existing = await Problem.getByMoodleId(problemData.moodle_problem_id);

    let problem;
    if (existing) {
      // Update existing
      problem = await Problem.update(existing.id, problemData);
    } else {
      // Create new
      problem = await Problem.create(problemData);
    }

    res.json({
      success: true,
      message: existing ? 'Problem updated from Moodle' : 'Problem created from Moodle',
      data: problem
    });
  } catch (error) {
    console.error('Error syncing from Moodle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync problem from Moodle',
      details: error.message
    });
  }
};

/**
 * Get course information
 */
exports.getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await moodleService.getCourse(courseId);

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course from Moodle'
    });
  }
};

/**
 * Test Moodle connection
 */
exports.testConnection = async (req, res) => {
  try {
    // Try a simple API call to test connection
    await moodleService.request('core_webservice_get_site_info');

    res.json({
      success: true,
      message: 'Moodle connection successful',
      moodleUrl: process.env.MOODLE_URL
    });
  } catch (error) {
    console.error('Moodle connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Moodle',
      details: error.message
    });
  }
};
