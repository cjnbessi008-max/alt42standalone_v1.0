<?php
/**
 * Get Progress API
 * Retrieves student progress and statistics
 */

require_once '../config/database.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request parameters
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    errorResponse('student_id is required');
}

try {
    $connection = getDbConnection();

    // Get student basic info
    $studentSql = "SELECT id, username, email, grade_level, total_score, total_attempts, last_activity_at
                   FROM glow_students WHERE id = ?";
    $studentStmt = $connection->prepare($studentSql);
    $studentStmt->bind_param('i', $student_id);
    $studentStmt->execute();
    $studentResult = $studentStmt->get_result();

    if ($studentResult->num_rows === 0) {
        errorResponse('Student not found', 404);
    }

    $student = $studentResult->fetch_assoc();
    $studentStmt->close();

    // Get progress summary
    $progressSql = "SELECT
                        COUNT(*) as total_sequences,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                        AVG(mastery_level) as avg_mastery,
                        SUM(best_score) as total_best_score
                    FROM glow_progress
                    WHERE student_id = ?";
    $progressStmt = $connection->prepare($progressSql);
    $progressStmt->bind_param('i', $student_id);
    $progressStmt->execute();
    $progressResult = $progressStmt->get_result();
    $progressSummary = $progressResult->fetch_assoc();
    $progressStmt->close();

    // Get detailed progress by sequence
    $detailSql = "SELECT
                      s.id,
                      s.sequence_type,
                      s.sequence_pattern,
                      s.difficulty_level,
                      p.status,
                      p.best_score,
                      p.total_attempts,
                      p.mastery_level,
                      p.first_attempt_at,
                      p.completed_at
                  FROM glow_progress p
                  JOIN glow_sequences s ON p.sequence_id = s.id
                  WHERE p.student_id = ?
                  ORDER BY p.first_attempt_at DESC";
    $detailStmt = $connection->prepare($detailSql);
    $detailStmt->bind_param('i', $student_id);
    $detailStmt->execute();
    $detailResult = $detailStmt->get_result();

    $sequences = [];
    while ($row = $detailResult->fetch_assoc()) {
        $sequences[] = [
            'sequence_id' => intval($row['id']),
            'sequence_type' => $row['sequence_type'],
            'sequence_pattern' => $row['sequence_pattern'],
            'difficulty_level' => $row['difficulty_level'],
            'status' => $row['status'],
            'best_score' => intval($row['best_score']),
            'total_attempts' => intval($row['total_attempts']),
            'mastery_level' => floatval($row['mastery_level']),
            'first_attempt_at' => $row['first_attempt_at'],
            'completed_at' => $row['completed_at']
        ];
    }
    $detailStmt->close();

    // Get recent attempts (last 10)
    $attemptsSql = "SELECT
                        a.id,
                        a.sequence_id,
                        s.sequence_pattern,
                        a.student_answer,
                        a.is_correct,
                        a.score_earned,
                        a.time_spent_seconds,
                        a.attempted_at
                    FROM glow_attempts a
                    JOIN glow_sequences s ON a.sequence_id = s.id
                    WHERE a.student_id = ?
                    ORDER BY a.attempted_at DESC
                    LIMIT 10";
    $attemptsStmt = $connection->prepare($attemptsSql);
    $attemptsStmt->bind_param('i', $student_id);
    $attemptsStmt->execute();
    $attemptsResult = $attemptsStmt->get_result();

    $recent_attempts = [];
    while ($row = $attemptsResult->fetch_assoc()) {
        $recent_attempts[] = [
            'attempt_id' => intval($row['id']),
            'sequence_id' => intval($row['sequence_id']),
            'sequence_pattern' => $row['sequence_pattern'],
            'student_answer' => $row['student_answer'],
            'is_correct' => boolval($row['is_correct']),
            'score_earned' => intval($row['score_earned']),
            'time_spent_seconds' => intval($row['time_spent_seconds']),
            'attempted_at' => $row['attempted_at']
        ];
    }
    $attemptsStmt->close();

    // Calculate statistics by difficulty
    $statsSql = "SELECT
                     s.difficulty_level,
                     COUNT(DISTINCT p.sequence_id) as attempted,
                     SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed,
                     AVG(p.mastery_level) as avg_mastery
                 FROM glow_progress p
                 JOIN glow_sequences s ON p.sequence_id = s.id
                 WHERE p.student_id = ?
                 GROUP BY s.difficulty_level";
    $statsStmt = $connection->prepare($statsSql);
    $statsStmt->bind_param('i', $student_id);
    $statsStmt->execute();
    $statsResult = $statsStmt->get_result();

    $difficulty_stats = [];
    while ($row = $statsResult->fetch_assoc()) {
        $difficulty_stats[$row['difficulty_level']] = [
            'attempted' => intval($row['attempted']),
            'completed' => intval($row['completed']),
            'avg_mastery' => round(floatval($row['avg_mastery']), 2)
        ];
    }
    $statsStmt->close();

    // Prepare response
    $response = [
        'student' => [
            'id' => intval($student['id']),
            'username' => $student['username'],
            'email' => $student['email'],
            'grade_level' => $student['grade_level'],
            'total_score' => intval($student['total_score']),
            'total_attempts' => intval($student['total_attempts']),
            'last_activity_at' => $student['last_activity_at']
        ],
        'summary' => [
            'total_sequences' => intval($progressSummary['total_sequences']),
            'completed' => intval($progressSummary['completed']),
            'in_progress' => intval($progressSummary['in_progress']),
            'failed' => intval($progressSummary['failed']),
            'avg_mastery' => round(floatval($progressSummary['avg_mastery']), 2),
            'total_best_score' => intval($progressSummary['total_best_score'])
        ],
        'sequences' => $sequences,
        'recent_attempts' => $recent_attempts,
        'difficulty_stats' => $difficulty_stats
    ];

    successResponse($response);

} catch (Exception $e) {
    error_log("Error in get_progress.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
