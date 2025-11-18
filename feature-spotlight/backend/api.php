<?php
/**
 * Feature Spotlight - REST API
 *
 * Provides endpoints for mathematical function analysis and Moodle integration
 */

require_once 'config.php';
require_once 'MoodleIntegration.php';

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

if (empty($action)) {
    sendJSONResponse([
        'success' => false,
        'error' => 'Missing action parameter'
    ], 400);
}

// Initialize Moodle integration
$moodle = new MoodleIntegration();

switch ($action) {
    case 'get_problem':
        handleGetProblem($moodle);
        break;

    case 'analyze_function':
        handleAnalyzeFunction($moodle);
        break;

    case 'get_features':
        handleGetFeatures($moodle);
        break;

    case 'save_interaction':
        handleSaveInteraction();
        break;

    case 'get_questions_list':
        handleGetQuestionsList($moodle);
        break;

    default:
        sendJSONResponse([
            'success' => false,
            'error' => 'Unknown action: ' . $action
        ], 400);
}

/**
 * Get problem/question from Moodle
 */
function handleGetProblem($moodle) {
    $questionId = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($questionId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid question ID'
        ], 400);
    }

    $question = $moodle->getQuestion($questionId);

    if ($question) {
        sendJSONResponse([
            'success' => true,
            'data' => $question
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'Question not found'
        ], 404);
    }
}

/**
 * Analyze mathematical function for features
 */
function handleAnalyzeFunction($moodle) {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['function'])) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Missing function parameter'
        ], 400);
    }

    $function = $input['function'];
    $questionId = isset($input['question_id']) ? intval($input['question_id']) : null;
    $xMin = isset($input['x_min']) ? floatval($input['x_min']) : ANALYSIS_RANGE_MIN;
    $xMax = isset($input['x_max']) ? floatval($input['x_max']) : ANALYSIS_RANGE_MAX;

    // Check cache if question_id is provided
    if ($questionId && CACHE_ENABLED) {
        $cached = $moodle->getQuestionMetadata($questionId, 'feature_analysis');
        if ($cached && (time() - $cached['timestamp']) < CACHE_TTL) {
            sendJSONResponse([
                'success' => true,
                'data' => $cached['features'],
                'cached' => true
            ]);
        }
    }

    // Perform analysis (delegated to frontend JavaScript for now)
    // In production, you might want to use a PHP math library or call a Python service
    $response = [
        'success' => true,
        'message' => 'Function received. Analysis should be performed client-side using math-analyzer.js',
        'function' => $function,
        'range' => ['min' => $xMin, 'max' => $xMax],
        'note' => 'Full numerical analysis requires client-side processing or separate computation service'
    ];

    sendJSONResponse($response);
}

/**
 * Get cached features for a problem
 */
function handleGetFeatures($moodle) {
    $questionId = isset($_GET['question_id']) ? intval($_GET['question_id']) : 0;

    if ($questionId <= 0) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Invalid question ID'
        ], 400);
    }

    $features = $moodle->getQuestionMetadata($questionId, 'feature_analysis');

    if ($features) {
        sendJSONResponse([
            'success' => true,
            'data' => $features
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'No cached features found'
        ], 404);
    }
}

/**
 * Save student interaction with highlighted features
 */
function handleSaveInteraction() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['question_id']) || !isset($input['feature_type'])) {
        sendJSONResponse([
            'success' => false,
            'error' => 'Missing required parameters'
        ], 400);
    }

    $conn = getDBConnection(FS_DB_NAME);

    $sql = "INSERT INTO " . FS_TABLE_PREFIX . "interactions
            (question_id, user_id, feature_type, feature_data, created_at)
            VALUES (?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);

    $questionId = intval($input['question_id']);
    $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $featureType = $input['feature_type'];
    $featureData = json_encode($input['feature_data'] ?? []);

    $stmt->bind_param("iiss", $questionId, $userId, $featureType, $featureData);

    if ($stmt->execute()) {
        sendJSONResponse([
            'success' => true,
            'message' => 'Interaction saved',
            'id' => $conn->insert_id
        ]);
    } else {
        sendJSONResponse([
            'success' => false,
            'error' => 'Failed to save interaction'
        ], 500);
    }
}

/**
 * Get list of questions (for demo/testing)
 */
function handleGetQuestionsList($moodle) {
    $type = isset($_GET['type']) ? $_GET['type'] : 'calculated';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

    $questions = $moodle->getQuestionsByType($type, $limit);

    sendJSONResponse([
        'success' => true,
        'count' => count($questions),
        'data' => $questions
    ]);
}
