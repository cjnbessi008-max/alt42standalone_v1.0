<?php
/**
 * Calm Growth App - REST API Endpoints
 * Handles all API requests from frontend
 */

require_once 'config.php';
require_once 'moodle_api.php';

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// Handle OPTIONS request for CORS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Route requests
try {
    switch ($endpoint) {
        case 'problems':
            handleProblems($method);
            break;

        case 'vibration':
            handleVibration($method);
            break;

        case 'activity':
            handleActivity($method);
            break;

        case 'sync':
            handleSync($method);
            break;

        case 'moodle-quizzes':
            handleMoodleQuizzes($method);
            break;

        default:
            sendError('Invalid endpoint', 404);
    }
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

/**
 * Handle /api.php?endpoint=problems
 */
function handleProblems($method) {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }

    $db = getDBConnection();
    $problemId = $_GET['id'] ?? null;

    if ($problemId) {
        // Get specific problem
        $stmt = $db->prepare("SELECT * FROM problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        sendResponse(['success' => true, 'data' => $problem]);
    } else {
        // Get all problems
        $stmt = $db->query("SELECT * FROM problems ORDER BY created_at DESC");
        $problems = $stmt->fetchAll();

        sendResponse(['success' => true, 'data' => $problems]);
    }
}

/**
 * Handle /api.php?endpoint=vibration
 * Calculate Calm Growth vibration intensity
 */
function handleVibration($method) {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }

    $userId = $_GET['user_id'] ?? 1;
    $problemId = $_GET['problem_id'] ?? null;

    $db = getDBConnection();

    // Get user's vibration settings
    $stmt = $db->prepare("SELECT * FROM vibration_settings WHERE user_id = ?");
    $stmt->execute([$userId]);
    $settings = $stmt->fetch();

    if (!$settings) {
        // Create default settings
        $stmt = $db->prepare("
            INSERT INTO vibration_settings (user_id) VALUES (?)
        ");
        $stmt->execute([$userId]);

        $settings = [
            'base_intensity' => 100.0,
            'damping_factor' => 1.5,
            'min_intensity' => 10.0,
            'enabled' => true
        ];
    }

    // Calculate cumulative log value from activity
    $logValue = 1.0;

    if ($problemId) {
        $stmt = $db->prepare("
            SELECT SUM(log_value) as total_log
            FROM activity_log
            WHERE user_id = ? AND problem_id = ?
        ");
        $stmt->execute([$userId, $problemId]);
        $result = $stmt->fetch();
        $logValue = $result['total_log'] ?? 1.0;
    } else {
        $stmt = $db->prepare("
            SELECT SUM(log_value) as total_log
            FROM activity_log
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $logValue = $result['total_log'] ?? 1.0;
    }

    // Calm Growth Algorithm: intensity decreases as log grows
    // Formula: intensity = base_intensity / (1 + damping_factor * log(value))
    $intensity = $settings['base_intensity'] / (1 + $settings['damping_factor'] * log($logValue + 1));
    $intensity = max($intensity, $settings['min_intensity']);

    // Calculate vibration frequency (Hz) - decreases with log
    $baseFrequency = 200; // Hz
    $frequency = $baseFrequency / (1 + log($logValue + 1));

    // Calculate vibration duration (ms) - increases slightly with log
    $baseDuration = 100; // ms
    $duration = $baseDuration + (log($logValue + 1) * 10);

    sendResponse([
        'success' => true,
        'data' => [
            'intensity' => round($intensity, 2),
            'frequency' => round($frequency, 2),
            'duration' => round($duration, 2),
            'log_value' => round($logValue, 4),
            'enabled' => (bool)$settings['enabled'],
            'message' => sprintf(
                'Calm Growth: Log value %.2f → Intensity %.1f%% (vibration calming)',
                $logValue,
                $intensity
            )
        ]
    ]);
}

/**
 * Handle /api.php?endpoint=activity
 * Log user activity
 */
function handleActivity($method) {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $userId = $input['user_id'] ?? 1;
    $problemId = $input['problem_id'] ?? null;
    $actionType = $input['action_type'] ?? 'view';
    $logValue = $input['log_value'] ?? 1.0;

    if (!$problemId) {
        sendError('Problem ID required', 400);
    }

    $db = getDBConnection();

    $stmt = $db->prepare("
        INSERT INTO activity_log (user_id, problem_id, action_type, log_value)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([$userId, $problemId, $actionType, $logValue]);

    sendResponse([
        'success' => true,
        'message' => 'Activity logged',
        'activity_id' => $db->lastInsertId()
    ]);
}

/**
 * Handle /api.php?endpoint=sync
 * Sync questions from Moodle
 */
function handleSync($method) {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $questionId = $input['question_id'] ?? null;

    if (!$questionId) {
        sendError('Question ID required', 400);
    }

    $moodle = new MoodleAPI();
    $success = $moodle->syncQuestionToLocal($questionId);

    if ($success) {
        sendResponse([
            'success' => true,
            'message' => 'Question synced successfully'
        ]);
    } else {
        sendError('Failed to sync question', 500);
    }
}

/**
 * Handle /api.php?endpoint=moodle-quizzes
 * Get quizzes from Moodle
 */
function handleMoodleQuizzes($method) {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }

    $quizId = $_GET['quiz_id'] ?? null;
    $moodle = new MoodleAPI();

    if ($quizId) {
        // Get specific quiz questions
        $questions = $moodle->getQuizQuestions($quizId);
        sendResponse(['success' => true, 'data' => $questions]);
    } else {
        // Get all quizzes
        $quizzes = $moodle->getQuizzes();
        sendResponse(['success' => true, 'data' => $quizzes]);
    }
}
