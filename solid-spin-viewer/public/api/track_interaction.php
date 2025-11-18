<?php
/**
 * API Endpoint: Track User Interaction
 * Records user interactions with 3D viewer
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../includes/db.php';

function sendResponse($success, $data = null, $message = '', $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, null, 'Only POST method is allowed', 405);
    }

    // Get JSON payload
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, null, 'Invalid JSON payload', 400);
    }

    // Validate required fields
    $requiredFields = ['moodle_user_id', 'question_id', 'interaction_type'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            sendResponse(false, null, "Missing required field: {$field}", 400);
        }
    }

    // Validate interaction type
    $validInteractionTypes = ['rotate', 'zoom', 'pan', 'reset'];
    if (!in_array($input['interaction_type'], $validInteractionTypes)) {
        sendResponse(false, null, 'Invalid interaction_type. Must be one of: ' . implode(', ', $validInteractionTypes), 400);
    }

    $db = Database::getInstance();

    // Insert interaction record
    $sql = "INSERT INTO user_interactions
            (moodle_user_id, question_id, interaction_type, rotation_x, rotation_y, rotation_z,
             zoom_level, time_spent_seconds, session_id)
            VALUES
            (:moodle_user_id, :question_id, :interaction_type, :rotation_x, :rotation_y, :rotation_z,
             :zoom_level, :time_spent_seconds, :session_id)";

    $params = [
        ':moodle_user_id' => (int)$input['moodle_user_id'],
        ':question_id' => (int)$input['question_id'],
        ':interaction_type' => $input['interaction_type'],
        ':rotation_x' => isset($input['rotation_x']) ? (float)$input['rotation_x'] : null,
        ':rotation_y' => isset($input['rotation_y']) ? (float)$input['rotation_y'] : null,
        ':rotation_z' => isset($input['rotation_z']) ? (float)$input['rotation_z'] : null,
        ':zoom_level' => isset($input['zoom_level']) ? (float)$input['zoom_level'] : null,
        ':time_spent_seconds' => isset($input['time_spent_seconds']) ? (int)$input['time_spent_seconds'] : 0,
        ':session_id' => isset($input['session_id']) ? $input['session_id'] : session_id()
    ];

    $stmt = $db->execute($sql, $params);
    $interactionId = $db->lastInsertId();

    sendResponse(true, [
        'interaction_id' => $interactionId,
        'recorded_at' => time()
    ], 'Interaction recorded successfully');

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendResponse(false, null, APP_DEBUG ? $e->getMessage() : 'An error occurred', 500);
}
