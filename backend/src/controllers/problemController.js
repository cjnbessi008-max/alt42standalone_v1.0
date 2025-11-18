const Problem = require('../models/Problem');

/**
 * Get all problems
 */
exports.getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.getAll();
    res.json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
};

/**
 * Get problem by ID
 */
exports.getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.getById(id);

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
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
};

/**
 * Get problem by Moodle ID
 */
exports.getProblemByMoodleId = async (req, res) => {
  try {
    const { moodleId } = req.params;
    const problem = await Problem.getByMoodleId(moodleId);

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
    console.error('Error fetching problem by Moodle ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
};

/**
 * Create new problem
 */
exports.createProblem = async (req, res) => {
  try {
    const problemData = req.body;

    // Validation
    if (!problemData.title || !problemData.function_expression) {
      return res.status(400).json({
        success: false,
        error: 'Title and function expression are required'
      });
    }

    const problem = await Problem.create(problemData);

    res.status(201).json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem'
    });
  }
};

/**
 * Update problem
 */
exports.updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problemData = req.body;

    const problem = await Problem.update(id, problemData);

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
    console.error('Error updating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem'
    });
  }
};

/**
 * Delete problem
 */
exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Problem.delete(id);

    if (!deleted) {
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

/**
 * Get smooth intervals for a problem
 */
exports.getSmoothIntervals = async (req, res) => {
  try {
    const { id } = req.params;
    const intervals = await Problem.getSmoothIntervals(id);

    res.json({
      success: true,
      count: intervals.length,
      data: intervals
    });
  } catch (error) {
    console.error('Error fetching smooth intervals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch smooth intervals'
    });
  }
};
