<?php
/**
 * Absolute Mirror API - Get Student Progress
 * Returns student progress and statistics
 */

require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(['success' => false, 'error' => 'Method not allowed'], 405);
}

try {
    // Get student ID from query parameter
    if (!isset($_GET['student_id'])) {
        sendJSON(['success' => false, 'error' => 'Student ID required'], 400);
    }

    $studentId = (int)$_GET['student_id'];

    // Get database connection
    $pdo = getDBConnection();

    // Get overall progress
    $stmt = $pdo->prepare("
        SELECT
            total_problems_attempted,
            total_problems_correct,
            accuracy_percentage,
            easy_attempted,
            easy_correct,
            medium_attempted,
            medium_correct,
            hard_attempted,
            hard_correct,
            total_time_spent_seconds,
            average_time_per_problem,
            total_sessions,
            last_activity_at
        FROM student_progress
        WHERE user_id = :user_id
    ");
    $stmt->execute([':user_id' => $studentId]);
    $progress = $stmt->fetch();

    if (!$progress) {
        // No progress yet, return empty progress
        $progress = [
            'total_problems_attempted' => 0,
            'total_problems_correct' => 0,
            'accuracy_percentage' => 0,
            'easy_attempted' => 0,
            'easy_correct' => 0,
            'medium_attempted' => 0,
            'medium_correct' => 0,
            'hard_attempted' => 0,
            'hard_correct' => 0,
            'total_time_spent_seconds' => 0,
            'average_time_per_problem' => 0,
            'total_sessions' => 0,
            'last_activity_at' => null
        ];
    }

    // Get recent attempts
    $stmt = $pdo->prepare("
        SELECT
            sa.id,
            sa.problem_id,
            p.title as problem_title,
            p.equation,
            p.difficulty,
            sa.answer_submitted,
            sa.is_correct,
            sa.attempt_number,
            sa.time_spent_seconds,
            sa.attempted_at
        FROM student_attempts sa
        JOIN problems p ON sa.problem_id = p.id
        WHERE sa.user_id = :user_id
        ORDER BY sa.attempted_at DESC
        LIMIT 10
    ");
    $stmt->execute([':user_id' => $studentId]);
    $recentAttempts = $stmt->fetchAll();

    // Get performance by difficulty
    $difficultyStats = [
        'easy' => [
            'attempted' => (int)$progress['easy_attempted'],
            'correct' => (int)$progress['easy_correct'],
            'accuracy' => $progress['easy_attempted'] > 0
                ? round(($progress['easy_correct'] / $progress['easy_attempted']) * 100, 2)
                : 0
        ],
        'medium' => [
            'attempted' => (int)$progress['medium_attempted'],
            'correct' => (int)$progress['medium_correct'],
            'accuracy' => $progress['medium_attempted'] > 0
                ? round(($progress['medium_correct'] / $progress['medium_attempted']) * 100, 2)
                : 0
        ],
        'hard' => [
            'attempted' => (int)$progress['hard_attempted'],
            'correct' => (int)$progress['hard_correct'],
            'accuracy' => $progress['hard_attempted'] > 0
                ? round(($progress['hard_correct'] / $progress['hard_attempted']) * 100, 2)
                : 0
        ]
    ];

    // Send response
    sendJSON([
        'success' => true,
        'data' => [
            'student_id' => $studentId,
            'summary' => [
                'total_attempted' => (int)$progress['total_problems_attempted'],
                'total_correct' => (int)$progress['total_problems_correct'],
                'accuracy' => (float)$progress['accuracy_percentage'],
                'total_time_spent' => (int)$progress['total_time_spent_seconds'],
                'average_time' => (int)$progress['average_time_per_problem'],
                'total_sessions' => (int)$progress['total_sessions'],
                'last_activity' => $progress['last_activity_at']
            ],
            'difficulty_breakdown' => $difficultyStats,
            'recent_attempts' => $recentAttempts
        ]
    ]);

} catch (Exception $e) {
    error_log("Error fetching progress: " . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Failed to fetch progress'
    ], 500);
}
