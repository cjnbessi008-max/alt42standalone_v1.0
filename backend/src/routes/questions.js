const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Create a new question in a session
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            sessionId,
            questionNumber,
            questionText,
            questionType,
            correctAnswer,
            difficultyLevel
        } = req.body;

        const result = await query(
            `INSERT INTO questions
             (session_id, question_number, question_text, question_type, correct_answer, difficulty_level)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [sessionId, questionNumber, questionText, questionType, correctAnswer, difficultyLevel || 1]
        );

        res.json({
            success: true,
            question: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Submit an answer to a question
router.post('/:questionId/answer', authenticateToken, async (req, res) => {
    try {
        const { questionId } = req.params;
        const {
            userAnswer,
            responseTimeMs,
            hesitationCount,
            clickCount,
            keystrokeCount,
            focusLostCount
        } = req.body;

        // Get the question
        const questionResult = await query(
            'SELECT * FROM questions WHERE id = $1',
            [questionId]
        );

        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        const question = questionResult.rows[0];
        const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

        // Calculate confidence score based on behavior
        let confidenceScore = 100;
        confidenceScore -= hesitationCount * 10; // Deduct for hesitations
        confidenceScore -= focusLostCount * 15; // Deduct for lost focus
        confidenceScore -= Math.min(20, (responseTimeMs / 1000) * 2); // Deduct for slow response
        confidenceScore = Math.max(0, Math.min(100, confidenceScore));

        // Record the response
        const result = await query(
            `INSERT INTO responses
             (question_id, user_answer, is_correct, response_time_ms,
              hesitation_count, click_count, keystroke_count, focus_lost_count, confidence_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                questionId,
                userAnswer,
                isCorrect,
                responseTimeMs,
                hesitationCount || 0,
                clickCount || 0,
                keystrokeCount || 0,
                focusLostCount || 0,
                confidenceScore.toFixed(2)
            ]
        );

        // Calculate real-time stamina metrics
        const sessionId = question.session_id;
        await updateStaminaMetrics(sessionId, questionResult.rows[0].question_number);

        res.json({
            success: true,
            response: {
                id: result.rows[0].id,
                isCorrect,
                confidenceScore: confidenceScore.toFixed(2),
                responseTimeMs
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to update stamina metrics
async function updateStaminaMetrics(sessionId, sequenceNumber) {
    try {
        // Calculate metrics for the last 5 questions
        const metricsResult = await query(
            `SELECT
                AVG(r.response_time_ms) as avg_response_time,
                SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as accuracy_rate,
                AVG(r.confidence_score) as attention_score,
                STDDEV(r.response_time_ms) as response_time_variance
             FROM responses r
             JOIN questions q ON r.question_id = q.id
             WHERE q.session_id = $1
             AND q.question_number > $2 - 5
             AND q.question_number <= $2`,
            [sessionId, sequenceNumber]
        );

        const metrics = metricsResult.rows[0];

        // Calculate fatigue index (0-100, higher = more fatigued)
        const avgTime = parseFloat(metrics.avg_response_time) || 0;
        const variance = parseFloat(metrics.response_time_variance) || 0;
        const accuracy = parseFloat(metrics.accuracy_rate) || 100;

        const fatigueIndex = Math.min(100,
            (avgTime / 100) * 0.3 + // Slow responses indicate fatigue
            (variance / 100) * 0.3 + // Inconsistency indicates fatigue
            ((100 - accuracy) * 0.4) // Low accuracy indicates fatigue
        );

        const consistencyScore = Math.max(0, 100 - (variance / 10));

        // Determine if break is recommended
        const recommendedBreak = fatigueIndex > 60;
        let breakUrgency = 'none';
        if (fatigueIndex > 80) breakUrgency = 'required';
        else if (fatigueIndex > 70) breakUrgency = 'recommended';
        else if (fatigueIndex > 60) breakUrgency = 'suggested';

        // Insert stamina metrics
        await query(
            `INSERT INTO stamina_metrics
             (session_id, sequence_number, avg_response_time_ms, accuracy_rate,
              fatigue_index, consistency_score, attention_score, recommended_break, break_urgency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                sessionId,
                sequenceNumber,
                avgTime,
                accuracy,
                fatigueIndex.toFixed(2),
                consistencyScore.toFixed(2),
                metrics.attention_score,
                recommendedBreak,
                breakUrgency
            ]
        );

        return {
            fatigueIndex,
            recommendedBreak,
            breakUrgency
        };
    } catch (error) {
        console.error('Error updating stamina metrics:', error);
        throw error;
    }
}

// Get questions for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT q.*, r.is_correct, r.response_time_ms, r.confidence_score
             FROM questions q
             LEFT JOIN responses r ON q.id = r.question_id
             WHERE q.session_id = $1
             ORDER BY q.question_number`,
            [sessionId]
        );

        res.json({
            success: true,
            questions: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
