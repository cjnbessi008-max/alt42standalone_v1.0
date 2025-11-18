<?php
/**
 * Activity Tracking API
 */

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use StressReset\StressDetector;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['session_id']) || !isset($input['activity_type'])) {
        throw new Exception('session_id and activity_type are required');
    }

    $validActivityTypes = ['click', 'keypress', 'scroll', 'idle'];
    if (!in_array($input['activity_type'], $validActivityTypes)) {
        throw new Exception('Invalid activity_type. Must be one of: ' . implode(', ', $validActivityTypes));
    }

    $stressDetector = new StressDetector();

    $activityId = $stressDetector->recordActivity(
        $input['session_id'],
        $input['activity_type'],
        $input['count'] ?? 1,
        $input['metadata'] ?? null
    );

    echo json_encode([
        'success' => true,
        'data' => [
            'activity_id' => $activityId,
        ],
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
