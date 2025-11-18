<?php
/**
 * Get Session Data
 * Returns user session information and Moodle integration data
 */

require_once __DIR__ . '/config.php';

// Set headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    // Get current Moodle user
    $moodleUser = getCurrentUser();

    if (!$moodleUser) {
        sendJSON([
            'success' => false,
            'error' => 'User not logged in'
        ], 401);
    }

    // Get course module ID from request
    $cmid = isset($_GET['cmid']) ? validateInt($_GET['cmid']) : null;

    if (!$cmid) {
        sendJSON([
            'success' => false,
            'error' => 'Course module ID is required'
        ], 400);
    }

    // Get course module details
    $cmDetails = getCourseModuleDetails($cmid);

    if (!$cmDetails) {
        sendJSON([
            'success' => false,
            'error' => 'Invalid course module'
        ], 404);
    }

    // Get or create user in local database
    $userId = getOrCreateUser(
        $moodleUser['id'],
        $moodleUser['username'],
        $moodleUser['email'],
        $moodleUser['fullname']
    );

    if (!$userId) {
        sendJSON([
            'success' => false,
            'error' => 'Failed to initialize user'
        ], 500);
    }

    // Create new session
    session_start();
    $sessionToken = bin2hex(random_bytes(32));

    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO cu_sessions (user_id, course_id, cm_id, session_token)
        VALUES (:user_id, :course_id, :cm_id, :session_token)
    ");

    $stmt->execute([
        'user_id' => $userId,
        'course_id' => $cmDetails['course']->id,
        'cm_id' => $cmid,
        'session_token' => $sessionToken
    ]);

    $sessionId = $db->lastInsertId();

    // Store session info
    $_SESSION[SESSION_PREFIX . 'session_id'] = $sessionId;
    $_SESSION[SESSION_PREFIX . 'user_id'] = $userId;
    $_SESSION[SESSION_PREFIX . 'moodle_user_id'] = $moodleUser['id'];
    $_SESSION[SESSION_PREFIX . 'course_id'] = $cmDetails['course']->id;
    $_SESSION[SESSION_PREFIX . 'cm_id'] = $cmid;
    $_SESSION[SESSION_PREFIX . 'token'] = $sessionToken;

    // Log event
    logEvent($userId, $sessionId, 'session_started', [
        'course_id' => $cmDetails['course']->id,
        'cm_id' => $cmid
    ]);

    // Get web service token (if available)
    $wstoken = null;
    if (function_exists('external_generate_token_for_current_user')) {
        $wstoken = external_generate_token_for_current_user('moodle_mobile_app');
    }

    // Return session data
    sendJSON([
        'success' => true,
        'sessionId' => $sessionId,
        'userId' => $userId,
        'moodleUserId' => $moodleUser['id'],
        'courseId' => $cmDetails['course']->id,
        'cmId' => $cmid,
        'wstoken' => $wstoken,
        'user' => [
            'username' => $moodleUser['username'],
            'fullname' => $moodleUser['fullname'],
            'email' => $moodleUser['email']
        ],
        'course' => [
            'id' => $cmDetails['course']->id,
            'shortname' => $cmDetails['course']->shortname,
            'fullname' => $cmDetails['course']->fullname
        ]
    ]);

} catch (Exception $e) {
    error_log('Error in get-session.php: ' . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'An error occurred while initializing session'
    ], 500);
}
