<?php
/**
 * Recommendation API Endpoints
 *
 * Provides AI-powered function recommendations
 */

require_once 'config.php';
require_once 'RecommendationEngine.php';

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if (empty($action)) {
    sendJSONResponse([
        'success' => false,
        'error' => 'Missing action parameter'
    ], 400);
}

switch ($action) {
    case 'get_recommendations':
        handleGetRecommendations();
        break;

    case 'get_student_profile':
        handleGetStudentProfile();
        break;

    case 'update_student_profile':
        handleUpdateStudentProfile();
        break;

    case 'record_attempt':
        handleRecordAttempt();
        break;

    case 'get_learning_paths':
        handleGetLearningPaths();
        break;

    case 'get_function_details':
        handleGetFunctionDetails();
        break;

    case 'rate_recommendation':
        handleRateRecommendation();
        break;

    case 'get_statistics':
        handleGetStatistics();
        break;

    default:
        sendJSONResponse([
            'success' => false,
            'error' => 'Unknown action: ' . $action
        ], 400);
}

/**
 * Get personalized recommendations
 */
function handleGetRecommendations() {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $count = isset($_GET['count']) ? intval($_GET['count']) : 5;
    $strategy = isset($_GET['strategy']) ? $_GET['strategy'] : 'hybrid';

    if ($userId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid user ID'
        ], 400);
    }

    try {
        $engine = new RecommendationEngine($userId);
        $recommendations = $engine->getRecommendations($count, ['strategy' => $strategy]);

        sendJSONResponse([
            'success' => true,
            'count' => count($recommendations),
            'strategy' => $strategy,
            'data' => $recommendations
        ]);

    } catch (Exception $e) {
        logError('Recommendation error: ' . $e->getMessage());
        sendJSONResponse([
            'success' => false,
            'error' => 'Failed to generate recommendations'
        ], 500);
    }
}

/**
 * Get student learning profile
 */
function handleGetStudentProfile() {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($userId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid user ID'
        ], 400);
    }

    $conn = getDBConnection(FS_DB_NAME);

    $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "student_profiles WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();

    if (!$profile) {
        // Create default profile
        $sql = "INSERT INTO " . FS_TABLE_PREFIX . "student_profiles (user_id) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $userId);
        $stmt->execute();

        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "student_profiles WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $profile = $stmt->get_result()->fetch_assoc();
    }

    // Get additional statistics
    $sql = "SELECT * FROM v_student_statistics WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    sendJSONResponse([
        'success' => true,
        'profile' => $profile,
        'statistics' => $stats
    ]);
}

/**
 * Update student profile
 */
function handleUpdateStudentProfile() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id'])) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Missing user_id'
        ], 400);
    }

    $userId = intval($input['user_id']);
    $conn = getDBConnection(FS_DB_NAME);

    $updates = [];
    $params = [];
    $types = '';

    // Build dynamic UPDATE query
    $allowedFields = [
        'skill_level', 'preferred_difficulty', 'learning_pace',
        'polynomial_mastery', 'trigonometry_mastery', 'exponential_mastery',
        'rational_mastery', 'calculus_mastery'
    ];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";

            if (strpos($field, 'mastery') !== false) {
                $types .= 'd';
                $params[] = floatval($input[$field]);
            } else {
                $types .= 's';
                $params[] = $input[$field];
            }
        }
    }

    if (empty($updates)) {
        sendJSONResponse([
            'success' => false,
            'error' => 'No valid fields to update'
        ], 400);
    }

    $sql = "UPDATE " . FS_TABLE_PREFIX . "student_profiles
            SET " . implode(', ', $updates) . "
            WHERE user_id = ?";

    $types .= 'i';
    $params[] = $userId;

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        sendJSONResponse([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'Failed to update profile'
        ], 500);
    }
}

/**
 * Record student attempt
 */
function handleRecordAttempt() {
    $input = json_decode(file_get_contents('php://input'), true);

    $requiredFields = ['user_id', 'function_id', 'is_correct', 'time_spent'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            sendJSONResponse([
                'success' => false,
                'error' => "Missing required field: $field"
            ], 400);
        }
    }

    $conn = getDBConnection(FS_DB_NAME);

    $sql = "INSERT INTO " . FS_TABLE_PREFIX . "attempt_history
            (user_id, function_id, question_id, is_correct, time_spent,
             hints_used, attempts_count, features_clicked, features_identified, accuracy_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    $userId = intval($input['user_id']);
    $functionId = intval($input['function_id']);
    $questionId = isset($input['question_id']) ? intval($input['question_id']) : null;
    $isCorrect = $input['is_correct'] ? 1 : 0;
    $timeSpent = intval($input['time_spent']);
    $hintsUsed = isset($input['hints_used']) ? intval($input['hints_used']) : 0;
    $attemptsCount = isset($input['attempts_count']) ? intval($input['attempts_count']) : 1;
    $featuresClicked = json_encode($input['features_clicked'] ?? []);
    $featuresIdentified = json_encode($input['features_identified'] ?? []);
    $accuracyScore = isset($input['accuracy_score']) ? floatval($input['accuracy_score']) : null;

    $stmt->bind_param('iiiiiisssd',
        $userId, $functionId, $questionId, $isCorrect, $timeSpent,
        $hintsUsed, $attemptsCount, $featuresClicked, $featuresIdentified, $accuracyScore
    );

    if ($stmt->execute()) {
        // Update student profile statistics
        updateStudentStatistics($userId, $isCorrect, $timeSpent);

        // Update function statistics
        updateFunctionStatistics($functionId, $isCorrect, $timeSpent);

        sendJSONResponse([
            'success' => true,
            'message' => 'Attempt recorded',
            'id' => $conn->insert_id
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'Failed to record attempt'
        ], 500);
    }
}

/**
 * Get available learning paths
 */
function handleGetLearningPaths() {
    $skillLevel = isset($_GET['skill_level']) ? $_GET['skill_level'] : null;

    $conn = getDBConnection(FS_DB_NAME);

    if ($skillLevel) {
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "learning_paths
                WHERE target_skill_level = ?
                AND is_published = TRUE
                ORDER BY path_name";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $skillLevel);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "learning_paths
                WHERE is_published = TRUE
                ORDER BY target_skill_level, path_name";

        $result = $conn->query($sql);
    }

    $paths = [];
    while ($row = $result->fetch_assoc()) {
        $row['function_sequence'] = json_decode($row['function_sequence'], true);
        $paths[] = $row;
    }

    sendJSONResponse([
        'success' => true,
        'count' => count($paths),
        'data' => $paths
    ]);
}

/**
 * Get function details from library
 */
function handleGetFunctionDetails() {
    $functionId = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($functionId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid function ID'
        ], 400);
    }

    $conn = getDBConnection(FS_DB_NAME);

    $sql = "SELECT * FROM " . FS_TABLE_PREFIX . "function_library WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $functionId);
    $stmt->execute();
    $function = $stmt->get_result()->fetch_assoc();

    if (!$function) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Function not found'
        ], 404);
    }

    // Decode JSON fields
    $function['concept_tags'] = json_decode($function['concept_tags'], true);
    $function['prerequisites'] = json_decode($function['prerequisites'], true);

    // Get popularity stats
    $sql = "SELECT * FROM v_function_popularity WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $functionId);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    sendJSONResponse([
        'success' => true,
        'function' => $function,
        'statistics' => $stats
    ]);
}

/**
 * Rate a recommendation
 */
function handleRateRecommendation() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['log_id']) || !isset($input['rating'])) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Missing required fields'
        ], 400);
    }

    $logId = intval($input['log_id']);
    $rating = intval($input['rating']);

    if ($rating < 1 || $rating > 5) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Rating must be between 1 and 5'
        ], 400);
    }

    $conn = getDBConnection(FS_DB_NAME);

    $sql = "UPDATE " . FS_TABLE_PREFIX . "recommendations_log
            SET user_rating = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ii', $rating, $logId);

    if ($stmt->execute()) {
        sendJSONResponse([
            'success' => true,
            'message' => 'Rating recorded'
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'Failed to record rating'
        ], 500);
    }
}

/**
 * Get student statistics
 */
function handleGetStatistics() {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($userId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid user ID'
        ], 400);
    }

    $conn = getDBConnection(FS_DB_NAME);

    // Get overall statistics
    $sql = "SELECT * FROM v_student_statistics WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $overall = $stmt->get_result()->fetch_assoc();

    // Get by function type
    $sql = "SELECT
                fl.function_type,
                COUNT(*) as attempts,
                SUM(CASE WHEN ah.is_correct THEN 1 ELSE 0 END) as correct,
                AVG(ah.time_spent) as avg_time,
                AVG(ah.accuracy_score) as avg_accuracy
            FROM " . FS_TABLE_PREFIX . "attempt_history ah
            JOIN " . FS_TABLE_PREFIX . "function_library fl ON ah.function_id = fl.id
            WHERE ah.user_id = ?
            GROUP BY fl.function_type";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $byType = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get recent progress
    $sql = "SELECT
                DATE(attempted_at) as date,
                COUNT(*) as attempts,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
            FROM " . FS_TABLE_PREFIX . "attempt_history
            WHERE user_id = ?
            AND attempted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(attempted_at)
            ORDER BY date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $progress = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    sendJSONResponse([
        'success' => true,
        'overall' => $overall,
        'by_type' => $byType,
        'recent_progress' => $progress
    ]);
}

/**
 * Update student statistics after attempt
 */
function updateStudentStatistics($userId, $isCorrect, $timeSpent) {
    $conn = getDBConnection(FS_DB_NAME);

    $sql = "UPDATE " . FS_TABLE_PREFIX . "student_profiles
            SET total_problems_attempted = total_problems_attempted + 1,
                total_problems_correct = total_problems_correct + ?,
                average_time_per_problem = (
                    (average_time_per_problem * total_problems_attempted + ?) /
                    (total_problems_attempted + 1)
                ),
                last_active_at = NOW()
            WHERE user_id = ?";

    $stmt = $conn->prepare($sql);
    $correct = $isCorrect ? 1 : 0;
    $stmt->bind_param('iii', $correct, $timeSpent, $userId);
    $stmt->execute();
}

/**
 * Update function statistics
 */
function updateFunctionStatistics($functionId, $isCorrect, $timeSpent) {
    $conn = getDBConnection(FS_DB_NAME);

    $sql = "UPDATE " . FS_TABLE_PREFIX . "function_library
            SET times_attempted = times_attempted + 1,
                average_success_rate = (
                    SELECT AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)
                    FROM " . FS_TABLE_PREFIX . "attempt_history
                    WHERE function_id = ?
                ),
                average_completion_time = (
                    SELECT AVG(time_spent)
                    FROM " . FS_TABLE_PREFIX . "attempt_history
                    WHERE function_id = ?
                )
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iii', $functionId, $functionId, $functionId);
    $stmt->execute();
}
