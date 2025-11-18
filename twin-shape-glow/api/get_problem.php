<?php
/**
 * API: Get Problem Data
 * Returns problem configuration for the game
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../includes/moodle_integration.php';

try {
    $problem_id = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

    if (!$problem_id) {
        throw new Exception('Problem ID is required');
    }

    $moodle = new MoodleIntegration();
    $tsg_conn = $moodle->getTSGConnection();

    // Get problem data
    $stmt = $tsg_conn->prepare("
        SELECT
            id,
            moodle_question_id,
            problem_type,
            difficulty,
            shape_config,
            correct_answer,
            time_limit,
            created_at
        FROM tsg_problems
        WHERE id = ?
    ");

    $stmt->bind_param("i", $problem_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $problem = $result->fetch_assoc();
    $stmt->close();

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    // Return problem data
    echo json_encode([
        'success' => true,
        'problem_id' => $problem['id'],
        'moodle_question_id' => $problem['moodle_question_id'],
        'problem_type' => $problem['problem_type'],
        'difficulty' => $problem['difficulty'],
        'shape_config' => $problem['shape_config'],
        'correct_answer' => $problem['correct_answer'],
        'time_limit' => $problem['time_limit'],
        'created_at' => $problem['created_at']
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
