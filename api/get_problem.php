<?php
/**
 * API: Get Problem Data
 * Retrieves vector problem from database or Moodle
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/moodle_api.php';

try {
    $db = Database::getInstance();
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : 1;
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    // Get problem from database
    $sql = "SELECT * FROM problems WHERE id = ?";
    $problem = $db->fetchOne($sql, [$problemId]);

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    // Get user's previous attempts
    $attempts = [];
    if ($userId) {
        $sql = "SELECT * FROM student_attempts
                WHERE problem_id = ? AND moodle_user_id = ?
                ORDER BY created_at DESC LIMIT 5";
        $attempts = $db->fetchAll($sql, [$problemId, $userId]);
    }

    // Calculate expected dot product
    $expectedDotProduct = ($problem['vector1_x'] * $problem['vector2_x']) +
                          ($problem['vector1_y'] * $problem['vector2_y']);

    $response = [
        'success' => true,
        'problem' => [
            'id' => $problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'vector1' => [
                'x' => floatval($problem['vector1_x']),
                'y' => floatval($problem['vector1_y'])
            ],
            'vector2' => [
                'x' => floatval($problem['vector2_x']),
                'y' => floatval($problem['vector2_y'])
            ],
            'difficulty' => $problem['difficulty'],
            'expectedAnswer' => floatval($expectedDotProduct)
        ],
        'attempts' => array_map(function($attempt) {
            return [
                'id' => $attempt['id'],
                'answer' => floatval($attempt['student_answer']),
                'dotProduct' => floatval($attempt['dot_product_value']),
                'heatColor' => $attempt['heat_color'],
                'isCorrect' => (bool)$attempt['is_correct'],
                'timeTaken' => intval($attempt['time_taken']),
                'attemptNumber' => intval($attempt['attempt_number']),
                'timestamp' => $attempt['created_at']
            ];
        }, $attempts)
    ];

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
