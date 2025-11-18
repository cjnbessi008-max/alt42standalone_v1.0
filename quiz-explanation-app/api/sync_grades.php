<?php
/**
 * API - Sync Grades to Moodle
 * Synchronizes quiz attempt grades to Moodle gradebook
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/moodle_api.php';

header('Content-Type: application/json');

ensureSession();

if (!isLoggedIn()) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $attemptId = isset($_POST['attempt_id']) ? intval($_POST['attempt_id']) : 0;

    if (!$attemptId) {
        throw new Exception('Attempt ID is required');
    }

    $db = Database::getInstance();

    // Get attempt details with user and quiz info
    $attempt = $db->queryOne(
        'SELECT
            qa.*,
            u.moodle_user_id,
            q.title as quiz_title,
            q.moodle_quiz_id
         FROM quiz_attempts qa
         JOIN users u ON qa.student_id = u.id
         JOIN quizzes q ON qa.quiz_id = q.id
         WHERE qa.id = ?',
        [$attemptId]
    );

    if (!$attempt) {
        throw new Exception('Quiz attempt not found');
    }

    // Check if already synced
    if ($attempt['synced_to_moodle']) {
        jsonResponse([
            'success' => true,
            'message' => 'Grade already synced to Moodle',
            'already_synced' => true
        ]);
    }

    // Check if Moodle is configured
    if (empty($attempt['moodle_user_id'])) {
        throw new Exception('Student not linked to Moodle account');
    }

    // Initialize Moodle API
    $moodleApi = new MoodleAPI();

    // Sync grade to Moodle
    // Note: This requires appropriate Moodle course ID
    // For now, we'll use a default course ID from settings
    $courseId = getSetting('moodle_default_course_id', 1);

    $result = $moodleApi->syncGrade(
        $attempt['moodle_user_id'],
        $courseId,
        $attempt['quiz_title'],
        $attempt['total_score'],
        100 // Max grade
    );

    // Update sync status
    $db->execute(
        'UPDATE quiz_attempts SET synced_to_moodle = 1, synced_at = ? WHERE id = ?',
        [date('Y-m-d H:i:s'), $attemptId]
    );

    jsonResponse([
        'success' => true,
        'message' => 'Grade synced to Moodle successfully',
        'data' => [
            'attempt_id' => $attemptId,
            'score' => $attempt['total_score'],
            'synced_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    logError('Grade sync failed: ' . $e->getMessage(), ['attempt_id' => $attemptId ?? null]);
    jsonResponse(['error' => $e->getMessage()], 500);
}
