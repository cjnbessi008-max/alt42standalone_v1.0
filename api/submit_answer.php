<?php
/**
 * API: Submit Answer
 * Records student answer and calculates heat visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../config.php';

/**
 * Calculate heat color based on dot product value
 * Maps dot product to warm/cold color temperature
 */
function calculateHeatColor($dotProduct, $maxMagnitude = 100) {
    // Normalize to -1.0 to 1.0
    $normalized = max(-1.0, min(1.0, $dotProduct / $maxMagnitude));

    // Map to 0-1 scale (0 = cold blue, 0.5 = neutral, 1 = warm red)
    $heatValue = ($normalized + 1.0) / 2.0;

    if ($heatValue < 0.5) {
        // Blue to White (cold to neutral)
        $ratio = $heatValue * 2;
        $r = intval(0 + (255 * $ratio));
        $g = intval(0 + (255 * $ratio));
        $b = 255;
    } else {
        // White to Red (neutral to warm)
        $ratio = ($heatValue - 0.5) * 2;
        $r = 255;
        $g = intval(255 - (255 * $ratio));
        $b = intval(255 - (255 * $ratio));
    }

    $temperature = intval($heatValue * 100);

    return [
        'hex' => sprintf('#%02X%02X%02X', $r, $g, $b),
        'rgb' => [$r, $g, $b],
        'temperature' => $temperature,
        'normalized' => round($normalized, 4)
    ];
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    $problemId = isset($input['problem_id']) ? intval($input['problem_id']) : 0;
    $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $studentAnswer = isset($input['answer']) ? floatval($input['answer']) : 0;
    $timeTaken = isset($input['time_taken']) ? intval($input['time_taken']) : 0;

    if (!$problemId || !$userId) {
        throw new Exception('Problem ID and User ID are required');
    }

    $db = Database::getInstance();

    // Get problem data
    $sql = "SELECT * FROM problems WHERE id = ?";
    $problem = $db->fetchOne($sql, [$problemId]);

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    // Calculate actual dot product
    $dotProduct = ($problem['vector1_x'] * $problem['vector2_x']) +
                  ($problem['vector1_y'] * $problem['vector2_y']);

    // Calculate heat color
    $maxMagnitude = max(abs($dotProduct), 100);
    $heatData = calculateHeatColor($dotProduct, $maxMagnitude);

    // Check if answer is correct (within 0.01 tolerance)
    $isCorrect = abs($studentAnswer - $dotProduct) < 0.01;

    // Get current attempt number
    $sql = "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
            FROM student_attempts
            WHERE problem_id = ? AND moodle_user_id = ?";
    $result = $db->fetchOne($sql, [$problemId, $userId]);
    $attemptNumber = $result['next_attempt'];

    // Insert student attempt
    $sql = "INSERT INTO student_attempts
            (problem_id, moodle_user_id, student_answer, dot_product_value,
             heat_color, is_correct, time_taken, attempt_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $db->query($sql, [
        $problemId,
        $userId,
        $studentAnswer,
        $dotProduct,
        $heatData['hex'],
        $isCorrect ? 1 : 0,
        $timeTaken,
        $attemptNumber
    ]);

    $attemptId = $db->lastInsertId();

    // Insert heat visualization record
    $sql = "INSERT INTO heat_visualizations
            (attempt_id, vector1_x, vector1_y, vector2_x, vector2_y,
             dot_product, normalized_value, heat_color, temperature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $db->query($sql, [
        $attemptId,
        $problem['vector1_x'],
        $problem['vector1_y'],
        $problem['vector2_x'],
        $problem['vector2_y'],
        $dotProduct,
        $heatData['normalized'],
        $heatData['hex'],
        $heatData['temperature']
    ]);

    // Prepare response
    $response = [
        'success' => true,
        'attempt_id' => $attemptId,
        'result' => [
            'dotProduct' => round($dotProduct, 4),
            'studentAnswer' => round($studentAnswer, 4),
            'isCorrect' => $isCorrect,
            'heatColor' => $heatData['hex'],
            'heatRgb' => $heatData['rgb'],
            'temperature' => $heatData['temperature'],
            'normalized' => $heatData['normalized'],
            'attemptNumber' => $attemptNumber
        ],
        'feedback' => $isCorrect ?
            '정답입니다! 🎉' :
            '다시 시도해보세요. 힌트: 내적 = (x₁×x₂) + (y₁×y₂)'
    ];

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
