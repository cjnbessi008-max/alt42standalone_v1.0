<?php
/**
 * API: Create Problem from Moodle Question
 * Creates a Twin Shape Glow problem from a Moodle question
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../includes/moodle_integration.php';

try {
    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        throw new Exception('Invalid request data');
    }

    $question_id = isset($data['question_id']) ? intval($data['question_id']) : null;
    $problem_type = isset($data['problem_type']) ? $data['problem_type'] : 'shape_matching';
    $difficulty = isset($data['difficulty']) ? intval($data['difficulty']) : 1;

    if (!$question_id) {
        throw new Exception('Question ID is required');
    }

    // Validate problem type
    $valid_types = ['shape_matching', 'color_sync', 'twin_find'];
    if (!in_array($problem_type, $valid_types)) {
        throw new Exception('Invalid problem type');
    }

    // Validate difficulty (1-5)
    if ($difficulty < 1 || $difficulty > 5) {
        throw new Exception('Difficulty must be between 1 and 5');
    }

    $moodle = new MoodleIntegration();
    $result = $moodle->createProblemFromQuestion($question_id, $problem_type, $difficulty);

    if (isset($result['error'])) {
        throw new Exception($result['error']);
    }

    echo json_encode([
        'success' => true,
        'problem_id' => $result['problem_id'],
        'question' => $result['question'],
        'config' => $result['config']
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
