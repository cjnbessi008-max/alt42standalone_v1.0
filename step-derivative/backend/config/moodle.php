<?php
/**
 * Moodle LMS Integration Configuration
 * Compatible with Moodle 3.7
 */

// Moodle configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: ''); // Web service token
define('MOODLE_SERVICE', 'step_derivative_service');

// Moodle web service endpoints
define('MOODLE_WS_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');
define('MOODLE_WS_FORMAT', 'json');

/**
 * Call Moodle web service function
 *
 * @param string $function Moodle web service function name
 * @param array $params Parameters for the function
 * @return mixed Response from Moodle
 * @throws Exception if web service call fails
 */
function callMoodleWebService($function, $params = []) {
    $url = MOODLE_WS_ENDPOINT;

    $postData = [
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => $function,
        'moodlewsrestformat' => MOODLE_WS_FORMAT
    ];

    // Merge with function-specific parameters
    $postData = array_merge($postData, $params);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false, // Use true in production with valid SSL
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("Moodle API call failed: " . $error);
        throw new Exception("Failed to connect to Moodle: " . $error);
    }

    if ($httpCode !== 200) {
        error_log("Moodle API returned HTTP " . $httpCode);
        throw new Exception("Moodle API error: HTTP " . $httpCode);
    }

    $data = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Invalid JSON from Moodle: " . json_last_error_msg());
        throw new Exception("Invalid response from Moodle");
    }

    // Check for Moodle error response
    if (isset($data['exception'])) {
        error_log("Moodle exception: " . $data['message']);
        throw new Exception("Moodle error: " . $data['message']);
    }

    return $data;
}

/**
 * Get question details from Moodle quiz
 *
 * @param int $questionId Question ID
 * @return array Question data
 */
function getMoodleQuestion($questionId) {
    return callMoodleWebService('core_question_get_question_data', [
        'questionid' => $questionId
    ]);
}

/**
 * Get user information from Moodle
 *
 * @param int $userId User ID
 * @return array User data
 */
function getMoodleUser($userId) {
    $result = callMoodleWebService('core_user_get_users_by_field', [
        'field' => 'id',
        'values[0]' => $userId
    ]);

    return !empty($result) ? $result[0] : null;
}

/**
 * Get course details from Moodle
 *
 * @param int $courseId Course ID
 * @return array Course data
 */
function getMoodleCourse($courseId) {
    $result = callMoodleWebService('core_course_get_courses', [
        'options[ids][0]' => $courseId
    ]);

    return !empty($result) ? $result[0] : null;
}

/**
 * Submit grade to Moodle gradebook
 *
 * @param int $userId User ID
 * @param int $itemId Grade item ID
 * @param float $grade Grade value
 * @return bool Success status
 */
function submitGradeToMoodle($userId, $itemId, $grade) {
    try {
        callMoodleWebService('core_grades_update_grades', [
            'source' => 'step_derivative',
            'courseid' => 0, // Will be determined by grade item
            'component' => 'mod_quiz',
            'activityid' => $itemId,
            'itemnumber' => 0,
            'grades[0][studentid]' => $userId,
            'grades[0][grade]' => $grade
        ]);
        return true;
    } catch (Exception $e) {
        error_log("Failed to submit grade: " . $e->getMessage());
        return false;
    }
}

/**
 * Authenticate user session with Moodle
 *
 * @param string $sessionToken Moodle session token
 * @return array|null User data if authenticated
 */
function authenticateWithMoodle($sessionToken) {
    // In Moodle 3.7, you would validate the session token
    // This is a simplified implementation
    try {
        // Get current user from Moodle session
        $result = callMoodleWebService('core_webservice_get_site_info', []);
        return $result;
    } catch (Exception $e) {
        error_log("Moodle authentication failed: " . $e->getMessage());
        return null;
    }
}
