<?php
/**
 * Moodle Integration API
 * Handles communication with Moodle LMS 3.7
 */

require_once __DIR__ . '/../config/database.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            handleMoodleRequest();
            break;
        case 'GET':
            handleMoodleGradeSync();
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    errorResponse($e->getMessage(), 500);
}

/**
 * Handle Moodle authentication and user sync
 */
function handleMoodleRequest() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['action'])) {
        errorResponse('Action is required', 400);
    }

    switch ($input['action']) {
        case 'authenticate':
            authenticateMoodleUser($input);
            break;
        case 'sync_progress':
            syncProgressToMoodle($input);
            break;
        default:
            errorResponse('Unknown action', 400);
    }
}

/**
 * Authenticate user via Moodle
 */
function authenticateMoodleUser($input) {
    if (!isset($input['moodle_user_id']) || !isset($input['moodle_course_id'])) {
        errorResponse('moodle_user_id and moodle_course_id are required', 400);
    }

    try {
        // Call Moodle Web Service API
        $moodleUser = callMoodleWebService('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$input['moodle_user_id']]
        ]);

        if (empty($moodleUser)) {
            errorResponse('Moodle user not found', 404);
        }

        $user = $moodleUser[0];

        successResponse([
            'user_id' => $input['moodle_user_id'],
            'username' => $user['username'] ?? 'unknown',
            'fullname' => $user['fullname'] ?? 'Unknown User',
            'email' => $user['email'] ?? '',
            'course_id' => $input['moodle_course_id']
        ], 'User authenticated successfully');
    } catch (Exception $e) {
        errorResponse('Moodle authentication failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Sync student progress back to Moodle gradebook
 */
function syncProgressToMoodle($input) {
    if (!isset($input['moodle_user_id']) || !isset($input['moodle_course_id']) || !isset($input['grade'])) {
        errorResponse('moodle_user_id, moodle_course_id, and grade are required', 400);
    }

    try {
        $pdo = getDbConnection();

        // Get session data
        $stmt = $pdo->prepare("
            SELECT * FROM learning_sessions
            WHERE moodle_user_id = ? AND moodle_course_id = ?
            ORDER BY start_time DESC
            LIMIT 1
        ");
        $stmt->execute([$input['moodle_user_id'], $input['moodle_course_id']]);
        $session = $stmt->fetch();

        if (!$session) {
            errorResponse('Session not found', 404);
        }

        // Sync grade to Moodle
        $result = callMoodleWebService('core_grades_update_grades', [
            'source' => 'shape_transformer',
            'courseid' => $input['moodle_course_id'],
            'component' => 'mod_assign',
            'activityid' => $input['activity_id'] ?? 0,
            'itemnumber' => 0,
            'grades' => [[
                'studentid' => $input['moodle_user_id'],
                'grade' => floatval($input['grade']),
                'feedback' => $input['feedback'] ?? 'Shape Transformer Activity Completed'
            ]]
        ]);

        successResponse([
            'synced' => true,
            'grade' => $input['grade'],
            'session_id' => $session['session_id']
        ], 'Progress synced to Moodle successfully');
    } catch (Exception $e) {
        errorResponse('Failed to sync to Moodle: ' . $e->getMessage(), 500);
    }
}

/**
 * Get grades from Moodle for analytics
 */
function handleMoodleGradeSync() {
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$courseId) {
        errorResponse('course_id is required', 400);
    }

    try {
        $params = ['courseid' => $courseId];
        if ($userId) {
            $params['userids'] = [$userId];
        }

        $grades = callMoodleWebService('gradereport_user_get_grades_table', $params);

        successResponse($grades, 'Grades retrieved from Moodle');
    } catch (Exception $e) {
        errorResponse('Failed to retrieve grades from Moodle: ' . $e->getMessage(), 500);
    }
}

/**
 * Call Moodle Web Service API
 * @param string $function Moodle web service function name
 * @param array $params Parameters for the function
 * @return mixed Response from Moodle
 */
function callMoodleWebService($function, $params = []) {
    if (empty(MOODLE_TOKEN)) {
        throw new Exception('Moodle token not configured');
    }

    $serverUrl = MOODLE_URL . '/webservice/rest/server.php';

    $requestParams = [
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => $function,
        'moodlewsrestformat' => 'json'
    ];

    // Merge function parameters
    $requestParams = array_merge($requestParams, $params);

    // Make HTTP request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $serverUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception('Moodle API request failed: ' . $error);
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Moodle API returned HTTP ' . $httpCode);
    }

    $data = json_decode($response, true);

    if (isset($data['exception'])) {
        throw new Exception('Moodle error: ' . $data['message']);
    }

    return $data;
}
