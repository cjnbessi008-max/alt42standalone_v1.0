<?php
/**
 * User Interactions API Endpoint
 * Tracks student interactions with shapes for learning analytics
 */

require_once __DIR__ . '/../config/database.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

try {
    switch ($method) {
        case 'POST':
            handleTrackInteraction($pdo);
            break;
        case 'GET':
            handleGetInteractions($pdo);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    errorResponse($e->getMessage(), 500);
}

/**
 * Track a new user interaction
 */
function handleTrackInteraction($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id']) || !isset($input['interaction_type'])) {
        errorResponse('user_id and interaction_type are required', 400);
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_interactions
            (user_id, session_id, shape_id, transformation_id, interaction_type,
             start_x, start_y, end_x, end_y, duration_ms, properties_viewed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $propertiesViewed = isset($input['properties_viewed'])
            ? json_encode($input['properties_viewed'])
            : null;

        $stmt->execute([
            $input['user_id'],
            $input['session_id'] ?? null,
            $input['shape_id'] ?? null,
            $input['transformation_id'] ?? null,
            $input['interaction_type'],
            $input['start_x'] ?? null,
            $input['start_y'] ?? null,
            $input['end_x'] ?? null,
            $input['end_y'] ?? null,
            $input['duration_ms'] ?? null,
            $propertiesViewed
        ]);

        // Update session total interactions
        if (isset($input['session_id'])) {
            updateSessionStats($pdo, $input['session_id']);
        }

        successResponse(['interaction_id' => $pdo->lastInsertId()], 'Interaction tracked successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Get interactions for analytics
 */
function handleGetInteractions($pdo) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $sessionId = isset($_GET['session_id']) ? $_GET['session_id'] : null;

    try {
        $query = "
            SELECT ui.*, s.name as shape_name, t.name as transformation_name
            FROM user_interactions ui
            LEFT JOIN shapes s ON ui.shape_id = s.shape_id
            LEFT JOIN transformations t ON ui.transformation_id = t.transformation_id
            WHERE 1=1
        ";
        $params = [];

        if ($userId) {
            $query .= " AND ui.user_id = ?";
            $params[] = $userId;
        }

        if ($sessionId) {
            $query .= " AND ui.session_id = ?";
            $params[] = $sessionId;
        }

        $query .= " ORDER BY ui.timestamp DESC LIMIT 100";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $interactions = $stmt->fetchAll();

        // Decode JSON fields
        foreach ($interactions as &$interaction) {
            if ($interaction['properties_viewed']) {
                $interaction['properties_viewed'] = json_decode($interaction['properties_viewed'], true);
            }
        }

        successResponse($interactions, 'Interactions retrieved successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Update learning session statistics
 */
function updateSessionStats($pdo, $sessionId) {
    try {
        $stmt = $pdo->prepare("
            UPDATE learning_sessions
            SET total_interactions = (
                    SELECT COUNT(*) FROM user_interactions
                    WHERE session_id = ?
                ),
                shapes_explored = (
                    SELECT COUNT(DISTINCT shape_id) FROM user_interactions
                    WHERE session_id = ? AND shape_id IS NOT NULL
                )
            WHERE session_id = ?
        ");
        $stmt->execute([$sessionId, $sessionId, $sessionId]);
    } catch (PDOException $e) {
        // Silent fail - don't block the main interaction tracking
        error_log("Failed to update session stats: " . $e->getMessage());
    }
}
