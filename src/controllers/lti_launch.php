<?php
/**
 * LTI Launch Controller
 * Handles incoming LTI requests from Moodle
 */

$ltiHandler = new LTIHandler();

// Validate LTI launch
if (!$ltiHandler->validateLaunch($_POST)) {
    http_response_code(403);
    die('Invalid LTI launch request');
}

// Process launch and create user session
$result = $ltiHandler->processLaunch($_POST);

// Store user and session info in PHP session
$_SESSION['user'] = $result['user'];
$_SESSION['lti_session_id'] = $result['session_id'];
$_SESSION['authenticated'] = true;

Logger::info('User authenticated via LTI', [
    'user_id' => $result['user']['id'],
    'role' => $result['user']['role']
]);

// Redirect based on user role
if ($result['user']['role'] === 'teacher' || $result['user']['role'] === 'admin') {
    header('Location: /teacher/dashboard');
} else {
    header('Location: /student/dashboard');
}
exit;
