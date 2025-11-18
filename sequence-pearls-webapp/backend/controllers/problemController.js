/**
 * Problem Controller
 * Handles problem generation and retrieval
 */

const db = require('../config/database');
const ProblemGenerator = require('../utils/problemGenerator');
const RecommendationEngine = require('../utils/recommendationEngine');

class ProblemController {
    /**
     * Get recommended problem for user
     * GET /api/problems/recommended
     */
    static async getRecommendedProblem(req, res) {
        try {
            const userId = req.user.id;

            // Get user profile
            const [profiles] = await db.query(
                'SELECT * FROM user_profiles WHERE user_id = ?',
                [userId]
            );

            if (profiles.length === 0) {
                return res.status(404).json({ error: 'User profile not found' });
            }

            const userProfile = profiles[0];

            // Get recent attempts
            const [recentAttempts] = await db.query(
                `SELECT a.*, p.sequence_type
                 FROM attempts a
                 JOIN problems p ON a.problem_id = p.id
                 WHERE a.user_id = ?
                 ORDER BY a.created_at DESC
                 LIMIT 10`,
                [userId]
            );

            // Get recommendation
            const recommendation = RecommendationEngine.getRecommendation(
                userProfile,
                recentAttempts
            );

            // Try to find existing problem
            let [problems] = await db.query(
                `SELECT * FROM problems
                 WHERE sequence_type = ? AND difficulty = ?
                 ORDER BY RAND()
                 LIMIT 1`,
                [recommendation.sequence_type, recommendation.difficulty]
            );

            let problem;

            if (problems.length === 0) {
                // Generate new problem
                const problemData = ProblemGenerator.generate(
                    recommendation.sequence_type,
                    recommendation.difficulty
                );

                // Insert into database
                const [result] = await db.query(
                    `INSERT INTO problems (sequence_type, difficulty, sequence_data,
                     missing_position, correct_answer, rule_formula, hint)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        problemData.sequence_type,
                        problemData.difficulty,
                        problemData.sequence_data,
                        problemData.missing_position,
                        problemData.correct_answer,
                        problemData.rule_formula,
                        problemData.hint
                    ]
                );

                problemData.id = result.insertId;
                problem = problemData;
            } else {
                problem = problems[0];
            }

            // Save recommendation
            await db.query(
                `INSERT INTO recommendations (user_id, problem_id, recommendation_score, reason)
                 VALUES (?, ?, ?, ?)`,
                [userId, problem.id, recommendation.recommendation_score, recommendation.reason]
            );

            // Return problem (without answer)
            res.json({
                id: problem.id,
                sequence_type: problem.sequence_type,
                difficulty: problem.difficulty,
                sequence_data: JSON.parse(problem.sequence_data),
                missing_position: problem.missing_position,
                hint: problem.hint,
                recommendation: {
                    score: recommendation.recommendation_score,
                    reason: recommendation.reason
                }
            });

        } catch (error) {
            console.error('Error getting recommended problem:', error);
            res.status(500).json({ error: 'Failed to get recommended problem' });
        }
    }

    /**
     * Submit answer for a problem
     * POST /api/problems/:id/submit
     */
    static async submitAnswer(req, res) {
        try {
            const userId = req.user.id;
            const problemId = parseInt(req.params.id);
            const { answer, timeSpent, hintUsed = false } = req.body;

            // Get problem
            const [problems] = await db.query(
                'SELECT * FROM problems WHERE id = ?',
                [problemId]
            );

            if (problems.length === 0) {
                return res.status(404).json({ error: 'Problem not found' });
            }

            const problem = problems[0];

            // Check answer
            const isCorrect = ProblemGenerator.checkAnswer(
                parseFloat(answer),
                parseFloat(problem.correct_answer)
            );

            // Count previous attempts for this problem
            const [prevAttempts] = await db.query(
                'SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND problem_id = ?',
                [userId, problemId]
            );

            const attemptNumber = prevAttempts[0].count + 1;

            // Save attempt
            await db.query(
                `INSERT INTO attempts (user_id, problem_id, user_answer, is_correct,
                 time_spent, hint_used, attempt_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, problemId, answer, isCorrect, timeSpent, hintUsed, attemptNumber]
            );

            // Update user profile
            await this.updateUserProfile(userId, isCorrect, timeSpent);

            // Mark recommendation as completed
            await db.query(
                'UPDATE recommendations SET is_completed = TRUE WHERE user_id = ? AND problem_id = ?',
                [userId, problemId]
            );

            // Get updated profile
            const [profiles] = await db.query(
                'SELECT * FROM user_profiles WHERE user_id = ?',
                [userId]
            );

            const userProfile = profiles[0];

            // Check for new achievements
            const [allAttempts] = await db.query(
                'SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [userId]
            );

            const newAchievements = RecommendationEngine.checkAchievements(
                userProfile,
                allAttempts
            );

            // Save new achievements
            for (const achievement of newAchievements) {
                await db.query(
                    `INSERT INTO achievements (user_id, achievement_type, achievement_name, achievement_description)
                     VALUES (?, ?, ?, ?)`,
                    [userId, achievement.type, achievement.name, achievement.description]
                );
            }

            res.json({
                correct: isCorrect,
                correct_answer: problem.correct_answer,
                explanation: problem.rule_formula,
                progress: {
                    total_solved: userProfile.total_problems_solved,
                    total_correct: userProfile.total_correct,
                    accuracy: (userProfile.total_correct / userProfile.total_problems_solved * 100).toFixed(1),
                    current_streak: userProfile.current_streak,
                    best_streak: userProfile.best_streak,
                    current_level: userProfile.current_level
                },
                achievements: newAchievements
            });

        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({ error: 'Failed to submit answer' });
        }
    }

    /**
     * Update user profile after attempt
     */
    static async updateUserProfile(userId, isCorrect, timeSpent) {
        const [profiles] = await db.query(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId]
        );

        const profile = profiles[0];

        // Update streak
        const newStreak = isCorrect ? profile.current_streak + 1 : 0;
        const newBestStreak = Math.max(newStreak, profile.best_streak);

        // Update totals
        const newTotalSolved = profile.total_problems_solved + 1;
        const newTotalCorrect = profile.total_correct + (isCorrect ? 1 : 0);

        // Get recent attempts for learning speed calculation
        const [recentAttempts] = await db.query(
            'SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [userId]
        );

        const newLearningSpeed = RecommendationEngine.updateLearningSpeed(
            profile,
            recentAttempts
        );

        // Calculate new difficulty
        const newDifficulty = RecommendationEngine.calculateDifficulty(
            profile,
            recentAttempts
        );

        // Update profile
        await db.query(
            `UPDATE user_profiles
             SET total_problems_solved = ?,
                 total_correct = ?,
                 current_streak = ?,
                 best_streak = ?,
                 learning_speed = ?,
                 last_difficulty = ?,
                 current_level = ?
             WHERE user_id = ?`,
            [
                newTotalSolved,
                newTotalCorrect,
                newStreak,
                newBestStreak,
                newLearningSpeed,
                newDifficulty,
                newDifficulty,
                userId
            ]
        );
    }

    /**
     * Get user statistics
     * GET /api/problems/stats
     */
    static async getStats(req, res) {
        try {
            const userId = req.user.id;

            const [stats] = await db.query(
                'SELECT * FROM user_statistics WHERE user_id = ?',
                [userId]
            );

            if (stats.length === 0) {
                return res.status(404).json({ error: 'Statistics not found' });
            }

            res.json(stats[0]);

        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    }

    /**
     * Get user achievements
     * GET /api/problems/achievements
     */
    static async getAchievements(req, res) {
        try {
            const userId = req.user.id;

            const [achievements] = await db.query(
                'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC',
                [userId]
            );

            res.json(achievements);

        } catch (error) {
            console.error('Error getting achievements:', error);
            res.status(500).json({ error: 'Failed to get achievements' });
        }
    }
}

module.exports = ProblemController;
