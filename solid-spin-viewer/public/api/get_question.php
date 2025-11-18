<?php
/**
 * API Endpoint: Get Question with 3D Solid Shape Data
 * Returns question info from Moodle and associated 3D solid shape
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/moodle_api.php';

/**
 * Send JSON response
 */
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

/**
 * Validate input
 */
function validateInput($key, $default = null, $type = 'int') {
    $value = $_GET[$key] ?? $_POST[$key] ?? $default;

    if ($value === null) {
        return null;
    }

    switch ($type) {
        case 'int':
            return filter_var($value, FILTER_VALIDATE_INT);
        case 'string':
            return filter_var($value, FILTER_SANITIZE_STRING);
        case 'email':
            return filter_var($value, FILTER_VALIDATE_EMAIL);
        default:
            return $value;
    }
}

try {
    $db = Database::getInstance();
    $moodleAPI = new MoodleAPI();

    // Get request parameters
    $questionId = validateInput('question_id', null, 'int');
    $userId = validateInput('user_id', null, 'int');
    $sessionToken = validateInput('session_token', null, 'string');

    if (!$questionId) {
        sendResponse(false, null, 'question_id parameter is required', 400);
    }

    // Verify session if token provided
    if ($sessionToken) {
        $verifiedUserId = $moodleAPI->verifySessionToken($sessionToken);
        if (!$verifiedUserId) {
            sendResponse(false, null, 'Invalid or expired session token', 401);
        }
        $userId = $verifiedUserId;
    }

    // Get question from Moodle
    $moodleQuestion = $moodleAPI->getQuestion($questionId);
    if (!$moodleQuestion) {
        sendResponse(false, null, 'Question not found in Moodle', 404);
    }

    // Get associated solid shape mapping
    $sql = "SELECT
                mq.*,
                ss.name,
                ss.name_kr,
                ss.vertices,
                ss.faces,
                ss.color,
                ss.category
            FROM moodle_questions mq
            INNER JOIN solid_shapes ss ON mq.solid_shape_id = ss.id
            WHERE mq.moodle_question_id = :question_id";

    $solidMapping = $db->fetchOne($sql, [':question_id' => $questionId]);

    if (!$solidMapping) {
        sendResponse(false, null, 'No 3D solid shape mapping found for this question', 404);
    }

    // Parse JSON data
    $solidMapping['vertices'] = json_decode($solidMapping['vertices'], true);
    $solidMapping['faces'] = json_decode($solidMapping['faces'], true);

    // Get user interaction history if user_id provided
    $userInteractions = [];
    if ($userId) {
        $sql = "SELECT
                    interaction_type,
                    rotation_x,
                    rotation_y,
                    rotation_z,
                    zoom_level,
                    time_spent_seconds,
                    created_at
                FROM user_interactions
                WHERE moodle_user_id = :user_id
                AND question_id = :question_id
                ORDER BY created_at DESC
                LIMIT 10";

        $userInteractions = $db->fetchAll($sql, [
            ':user_id' => $userId,
            ':question_id' => $solidMapping['id']
        ]);

        // Log this access
        $moodleAPI->logActivity($userId, 'viewed', $questionId, 'question');
    }

    // Build response
    $response = [
        'question' => [
            'id' => $moodleQuestion['id'],
            'name' => $moodleQuestion['name'],
            'text' => $moodleQuestion['questiontext'],
            'type' => $moodleQuestion['qtype'],
            'category' => $moodleQuestion['category_name'],
            'default_mark' => $moodleQuestion['defaultmark'],
            'created' => $moodleQuestion['timecreated'],
            'modified' => $moodleQuestion['timemodified']
        ],
        'solid_shape' => [
            'id' => $solidMapping['solid_shape_id'],
            'name' => $solidMapping['name'],
            'name_kr' => $solidMapping['name_kr'],
            'color' => $solidMapping['color'],
            'category' => $solidMapping['category'],
            'geometry' => [
                'vertices' => $solidMapping['vertices'],
                'faces' => $solidMapping['faces']
            ]
        ],
        'viewer_settings' => [
            'rotation_enabled' => (bool)$solidMapping['rotation_enabled'],
            'auto_rotate' => (bool)$solidMapping['auto_rotate'],
            'rotation_speed' => (float)$solidMapping['rotation_speed'],
            'initial_rotation' => [
                'x' => (float)$solidMapping['initial_rotation_x'],
                'y' => (float)$solidMapping['initial_rotation_y'],
                'z' => (float)$solidMapping['initial_rotation_z']
            ],
            'zoom_level' => (float)$solidMapping['zoom_level']
        ],
        'user_interactions' => $userInteractions
    ];

    sendResponse(true, $response, 'Question and solid shape data retrieved successfully');

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendResponse(false, null, APP_DEBUG ? $e->getMessage() : 'An error occurred', 500);
}
