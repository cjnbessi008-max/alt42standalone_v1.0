<?php
/**
 * User Preferences API
 * Manage user settings for guide line generation
 */

require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();
$user_id = getCurrentUserId();

switch ($method) {
    case 'GET':
        getPreferences($pdo, $user_id);
        break;
    case 'PUT':
        updatePreferences($pdo, $user_id);
        break;
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}

/**
 * GET user preferences
 */
function getPreferences($pdo, $user_id) {
    $stmt = $pdo->prepare("SELECT * FROM user_preferences WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $prefs = $stmt->fetch();

    if (!$prefs) {
        // Create default preferences
        $stmt = $pdo->prepare("
            INSERT INTO user_preferences (user_id) VALUES (?)
        ");
        $stmt->execute([$user_id]);

        $stmt = $pdo->prepare("SELECT * FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $prefs = $stmt->fetch();
    }

    sendJSON(['success' => true, 'preferences' => $prefs]);
}

/**
 * UPDATE user preferences
 */
function updatePreferences($pdo, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);

    $allowed_fields = [
        'auto_generate_parallel',
        'auto_generate_perpendicular',
        'parallel_line_color',
        'perpendicular_line_color',
        'line_thickness',
        'show_labels'
    ];

    $updates = [];
    $params = [];

    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        sendJSON(['error' => 'No valid fields to update'], 400);
    }

    $params[] = $user_id;

    $sql = "UPDATE user_preferences SET " . implode(', ', $updates) . " WHERE user_id = ?";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendJSON(['success' => true, 'message' => 'Preferences updated']);
    } catch (Exception $e) {
        sendJSON(['error' => 'Failed to update preferences: ' . $e->getMessage()], 500);
    }
}
