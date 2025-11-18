/**
 * Chaos Harmony Patterns Controller
 * Analyzes learning patterns and provides visualization data
 */

import { get, all, run } from '../config/database.js';

/**
 * Analyze and generate chaos patterns for a student
 */
export function analyzePatterns(req, res) {
    try {
        const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;
        const quizId = req.query.quiz_id;

        // Check permissions
        if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Get recent attempts and answers
        let answersQuery = `
            SELECT sa.*, qa.quiz_id, qa.completed_at as attempt_completed_at
            FROM student_answers sa
            JOIN quiz_attempts qa ON qa.id = sa.attempt_id
            WHERE qa.student_id = ? AND qa.is_completed = 1
        `;
        const params = [studentId];

        if (quizId) {
            answersQuery += ' AND qa.quiz_id = ?';
            params.push(quizId);
        }

        answersQuery += ' ORDER BY sa.answered_at DESC LIMIT 100';

        const answers = all(answersQuery, params);

        if (answers.length === 0) {
            return res.json({ patterns: [] });
        }

        // Calculate patterns
        const patterns = [];

        // Pattern 1: Success Rhythm
        const successRhythm = calculateSuccessRhythm(answers);
        if (successRhythm) {
            patterns.push(successRhythm);
        }

        // Pattern 2: Struggle Wave
        const struggleWave = calculateStruggleWave(answers);
        if (struggleWave) {
            patterns.push(struggleWave);
        }

        // Pattern 3: Speed Pattern
        const speedPattern = calculateSpeedPattern(answers);
        if (speedPattern) {
            patterns.push(speedPattern);
        }

        // Pattern 4: Breakthrough Burst (improvement over time)
        const breakthrough = calculateBreakthrough(answers);
        if (breakthrough) {
            patterns.push(breakthrough);
        }

        // Save patterns to database
        for (const pattern of patterns) {
            run(
                `INSERT INTO chaos_patterns (student_id, quiz_id, pattern_type, intensity, frequency, metadata)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    studentId,
                    quizId || null,
                    pattern.type,
                    pattern.intensity,
                    pattern.frequency,
                    JSON.stringify(pattern.metadata)
                ]
            );
        }

        // Update visualization state
        updateVisualizationState(studentId, patterns);

        res.json({ patterns });
    } catch (error) {
        console.error('Analyze patterns error:', error);
        res.status(500).json({ error: 'Server error analyzing patterns' });
    }
}

/**
 * Calculate Success Rhythm pattern
 */
function calculateSuccessRhythm(answers) {
    let maxStreak = 0;
    let currentStreak = 0;
    let totalCorrect = 0;

    for (const answer of answers) {
        if (answer.is_correct) {
            currentStreak++;
            totalCorrect++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    if (maxStreak === 0) return null;

    const intensity = Math.min(1.0, maxStreak / 10);
    const frequency = totalCorrect / answers.length;

    return {
        type: 'success_rhythm',
        intensity,
        frequency,
        metadata: {
            max_streak: maxStreak,
            total_correct: totalCorrect,
            total_answers: answers.length
        }
    };
}

/**
 * Calculate Struggle Wave pattern
 */
function calculateStruggleWave(answers) {
    let alternations = 0;

    for (let i = 1; i < answers.length; i++) {
        if (answers[i].is_correct !== answers[i - 1].is_correct) {
            alternations++;
        }
    }

    if (alternations === 0) return null;

    const intensity = Math.min(1.0, alternations / answers.length);
    const frequency = alternations / (answers.length - 1);

    return {
        type: 'struggle_wave',
        intensity,
        frequency,
        metadata: {
            alternations,
            total_answers: answers.length
        }
    };
}

/**
 * Calculate Speed Pattern
 */
function calculateSpeedPattern(answers) {
    const responseTimes = answers
        .filter(a => a.response_time)
        .map(a => a.response_time);

    if (responseTimes.length < 2) return null;

    const avgTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const variance = responseTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    const intensity = Math.min(1.0, stdDev / avgTime);
    const frequency = 1.0;

    return {
        type: 'speed_pattern',
        intensity,
        frequency,
        metadata: {
            avg_time: Math.round(avgTime * 100) / 100,
            std_dev: Math.round(stdDev * 100) / 100,
            fastest: Math.min(...responseTimes),
            slowest: Math.max(...responseTimes)
        }
    };
}

/**
 * Calculate Breakthrough pattern (improvement over time)
 */
function calculateBreakthrough(answers) {
    if (answers.length < 10) return null;

    // Split into recent and older halves
    const halfPoint = Math.floor(answers.length / 2);
    const recent = answers.slice(0, halfPoint);
    const older = answers.slice(halfPoint);

    const recentAccuracy = recent.filter(a => a.is_correct).length / recent.length;
    const olderAccuracy = older.filter(a => a.is_correct).length / older.length;

    const improvement = recentAccuracy - olderAccuracy;

    if (improvement <= 0) return null;

    const intensity = Math.min(1.0, improvement * 2);
    const frequency = improvement;

    return {
        type: 'breakthrough_burst',
        intensity,
        frequency,
        metadata: {
            recent_accuracy: Math.round(recentAccuracy * 100),
            older_accuracy: Math.round(olderAccuracy * 100),
            improvement: Math.round(improvement * 100)
        }
    };
}

/**
 * Update visualization state based on patterns
 */
function updateVisualizationState(studentId, patterns) {
    // Determine emotion based on patterns
    let emotion = 'neutral';
    let maxIntensity = 0;

    for (const pattern of patterns) {
        if (pattern.intensity > maxIntensity) {
            maxIntensity = pattern.intensity;

            switch (pattern.type) {
                case 'success_rhythm':
                    emotion = pattern.intensity > 0.7 ? 'flow' : 'joy';
                    break;
                case 'struggle_wave':
                    emotion = 'struggle';
                    break;
                case 'breakthrough_burst':
                    emotion = 'breakthrough';
                    break;
            }
        }
    }

    // Calculate animation speed
    const totalIntensity = patterns.reduce((sum, p) => sum + p.intensity, 0);
    const animationSpeed = 0.5 + (totalIntensity / patterns.length);

    // Determine color palette based on emotion
    let colorPalette;
    switch (emotion) {
        case 'joy':
            colorPalette = { primary: '#4ade80', secondary: '#22c55e', accent: '#86efac' };
            break;
        case 'flow':
            colorPalette = { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' };
            break;
        case 'struggle':
            colorPalette = { primary: '#f87171', secondary: '#ef4444', accent: '#fca5a5' };
            break;
        case 'breakthrough':
            colorPalette = { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fcd34d' };
            break;
        default:
            colorPalette = { primary: '#60a5fa', secondary: '#3b82f6', accent: '#93c5fd' };
    }

    // Update or insert visualization state
    const existing = get('SELECT id FROM visualization_state WHERE student_id = ?', [studentId]);

    if (existing) {
        run(
            `UPDATE visualization_state
             SET current_emotion = ?, color_palette = ?, animation_speed = ?
             WHERE student_id = ?`,
            [emotion, JSON.stringify(colorPalette), animationSpeed, studentId]
        );
    } else {
        run(
            `INSERT INTO visualization_state (student_id, current_emotion, color_palette, animation_speed)
             VALUES (?, ?, ?, ?)`,
            [studentId, emotion, JSON.stringify(colorPalette), animationSpeed]
        );
    }
}

/**
 * Get visualization state for a student
 */
export function getVisualizationState(req, res) {
    try {
        const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

        // Check permissions
        if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const state = get('SELECT * FROM visualization_state WHERE student_id = ?', [studentId]);

        if (!state) {
            // Return default state
            return res.json({
                student_id: studentId,
                current_emotion: 'neutral',
                color_palette: { primary: '#60a5fa', secondary: '#3b82f6', accent: '#93c5fd' },
                animation_speed: 1.0
            });
        }

        // Parse color_palette if it's a string
        if (typeof state.color_palette === 'string') {
            state.color_palette = JSON.parse(state.color_palette);
        }

        res.json(state);
    } catch (error) {
        console.error('Get visualization state error:', error);
        res.status(500).json({ error: 'Server error fetching visualization state' });
    }
}

/**
 * Get recent patterns for a student
 */
export function getPatterns(req, res) {
    try {
        const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;
        const quizId = req.query.quiz_id;

        // Check permissions
        if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        let query = 'SELECT * FROM chaos_patterns WHERE student_id = ?';
        const params = [studentId];

        if (quizId) {
            query += ' AND quiz_id = ?';
            params.push(quizId);
        }

        query += ' ORDER BY created_at DESC LIMIT 10';

        const patterns = all(query, params);

        // Parse metadata
        for (const pattern of patterns) {
            if (typeof pattern.metadata === 'string') {
                pattern.metadata = JSON.parse(pattern.metadata);
            }
        }

        res.json({ patterns });
    } catch (error) {
        console.error('Get patterns error:', error);
        res.status(500).json({ error: 'Server error fetching patterns' });
    }
}

/**
 * Get aggregated analytics for a student
 */
export function getAnalytics(req, res) {
    try {
        const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

        // Check permissions
        if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const analytics = get(
            `SELECT
                COUNT(DISTINCT quiz_id) as quizzes_completed,
                SUM(total_attempts) as total_attempts,
                ROUND(AVG(avg_score), 2) as overall_avg_score,
                SUM(total_time_spent) as total_time_spent,
                SUM(correct_answers) as total_correct,
                SUM(total_answers) as total_answers,
                ROUND(CAST(SUM(correct_answers) AS FLOAT) / SUM(total_answers) * 100, 2) as accuracy
             FROM analytics_summary
             WHERE student_id = ?`,
            [studentId]
        );

        // Get recent performance trend
        const recentAttempts = all(
            `SELECT score, completed_at
             FROM quiz_attempts
             WHERE student_id = ? AND is_completed = 1
             ORDER BY completed_at DESC
             LIMIT 10`,
            [studentId]
        );

        res.json({
            analytics: analytics || {
                quizzes_completed: 0,
                total_attempts: 0,
                overall_avg_score: 0,
                total_time_spent: 0,
                total_correct: 0,
                total_answers: 0,
                accuracy: 0
            },
            recent_attempts: recentAttempts
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Server error fetching analytics' });
    }
}
