// Moodle Controller
// Handles HTTP requests for Moodle integration
const moodleService = require('../services/moodleService');
const { query } = require('../config/database');

class MoodleController {
    /**
     * GET /api/moodle/test
     * Test Moodle connection
     */
    async testConnection(req, res) {
        try {
            const isConnected = await moodleService.testConnection();

            res.json({
                success: isConnected,
                message: isConnected ? 'Moodle connection successful' : 'Moodle connection failed'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to test Moodle connection',
                message: error.message
            });
        }
    }

    /**
     * GET /api/problems/:id
     * Get problem from cache or Moodle
     */
    async getProblem(req, res) {
        try {
            const problemId = parseInt(req.params.id);

            // First, check cache
            const cachedProblem = await query(
                'SELECT * FROM moodle_problems WHERE moodle_problem_id = ?',
                [problemId]
            );

            if (cachedProblem.length > 0) {
                // Extract numbers from problem text
                const numbers = moodleService.extractNumbersFromProblem(
                    cachedProblem[0].problem_text
                );

                return res.json({
                    success: true,
                    data: {
                        ...cachedProblem[0],
                        numbers: numbers,
                        cached: true
                    }
                });
            }

            // If not cached, fetch from Moodle (placeholder)
            // In production, implement actual Moodle API call
            res.json({
                success: false,
                error: 'Problem not found in cache and Moodle API not configured',
                hint: 'Use sample problems with IDs 1, 2, or 3'
            });
        } catch (error) {
            console.error('Error fetching problem:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch problem'
            });
        }
    }

    /**
     * GET /api/moodle/courses/:userId
     * Get user's courses from Moodle
     */
    async getUserCourses(req, res) {
        try {
            const userId = parseInt(req.params.userId);

            const courses = await moodleService.getUserCourses(userId);

            res.json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error fetching user courses:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user courses',
                message: error.message
            });
        }
    }

    /**
     * GET /api/moodle/course/:courseId/contents
     * Get course contents from Moodle
     */
    async getCourseContents(req, res) {
        try {
            const courseId = parseInt(req.params.courseId);

            const contents = await moodleService.getCourseContents(courseId);

            res.json({
                success: true,
                data: contents
            });
        } catch (error) {
            console.error('Error fetching course contents:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch course contents',
                message: error.message
            });
        }
    }
}

module.exports = new MoodleController();
