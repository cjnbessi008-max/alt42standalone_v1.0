<?php
/**
 * API Endpoint: Get Courses
 * Returns list of available courses from Moodle
 */

header('Content-Type: application/json');
require_once('../config.php');
require_once('../lib/moodle_api.php');

try {
    $moodle = new MoodleAPI();
    $courses = $moodle->getCourses();

    if ($courses === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Failed to fetch courses from Moodle'
        ]);
        exit;
    }

    // Return courses
    echo json_encode($courses);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Internal server error',
        'details' => APP_DEBUG ? $e->getMessage() : null
    ]);
}
