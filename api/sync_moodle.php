<?php
/**
 * API Endpoint: Sync with Moodle
 * Fetches quiz questions from Moodle and stores them locally
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/MoodleConnector.php';

try {
    $db = Database::getInstance()->getConnection();
    $moodle = new MoodleConnector();

    // Get parameters
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;

    if (!$courseId && !$quizId) {
        throw new Exception('Course ID or Quiz ID is required');
    }

    $synced = [];

    if ($quizId) {
        // Sync specific quiz
        $quizData = $moodle->getQuizQuestions($quizId);
        $synced = syncQuizQuestions($db, $quizData, $quizId);
    } else {
        // Sync all quizzes from course
        $courseContents = $moodle->getCourseContents($courseId);
        // Process course contents and sync quizzes
        // This would require parsing Moodle's course structure
    }

    echo json_encode([
        'success' => true,
        'message' => 'Sync completed',
        'synced' => $synced
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sync error: ' . $e->getMessage()
    ]);
}

function syncQuizQuestions($db, $quizData, $quizId) {
    $synced = [];

    // This is a simplified example
    // Actual implementation would parse Moodle's quiz data structure
    // and extract relevant information

    // For demonstration, we'll create a sample problem
    $stmt = $db->prepare("
        INSERT INTO problems (
            moodle_question_id,
            moodle_quiz_id,
            title,
            description,
            problem_type,
            min_value,
            max_value,
            graph_data
        ) VALUES (
            :moodle_question_id,
            :moodle_quiz_id,
            :title,
            :description,
            :problem_type,
            :min_value,
            :max_value,
            :graph_data
        )
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            updated_at = CURRENT_TIMESTAMP
    ");

    // Example: This would be replaced with actual quiz data parsing
    $stmt->execute([
        'moodle_question_id' => 1001,
        'moodle_quiz_id' => $quizId,
        'title' => 'Moodle에서 가져온 문제',
        'description' => '이 문제는 Moodle에서 동기화되었습니다.',
        'problem_type' => 'inequality',
        'min_value' => 0,
        'max_value' => 10,
        'graph_data' => json_encode(['type' => 'inequality', 'operator' => '>=', 'value' => 5])
    ]);

    $synced[] = $db->lastInsertId();

    return $synced;
}
