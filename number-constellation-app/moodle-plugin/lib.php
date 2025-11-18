<?php
// This file is part of Moodle - http://moodle.org/
//
// Number Constellation - Moodle Plugin Library
// Compatible with Moodle 3.7, PHP 7.1.9

defined('MOODLE_INTERNAL') || die();

/**
 * Send problem data to Number Constellation app
 *
 * @param int $courseid Moodle course ID
 * @param int $userid Moodle user ID
 * @param string $problemtype Type of problem (prime, multiple, natural, etc.)
 * @param int $rangestart Start of number range
 * @param int $rangeend End of number range
 * @param string $difficulty Difficulty level (easy, medium, hard)
 * @param array $problemdata Additional problem data
 * @return object Response from Number Constellation API
 */
function local_numconstellation_send_problem($courseid, $userid, $problemtype, $rangestart, $rangeend, $difficulty = 'medium', $problemdata = array()) {
    global $CFG;

    // Get API endpoint from config (default to localhost)
    $api_url = get_config('local_numconstellation', 'api_url');
    if (empty($api_url)) {
        $api_url = 'http://localhost:8080/api/problem.php';
    }

    // Get API key from config
    $api_key = get_config('local_numconstellation', 'api_key');

    // Generate unique problem ID
    $problem_id = 'NC_' . $courseid . '_' . time() . '_' . uniqid();

    // Prepare data
    $data = array(
        'moodle_problem_id' => $problem_id,
        'moodle_course_id' => $courseid,
        'moodle_user_id' => $userid,
        'problem_type' => $problemtype,
        'number_range_start' => $rangestart,
        'number_range_end' => $rangeend,
        'difficulty_level' => $difficulty,
        'problem_data' => json_encode($problemdata)
    );

    // Send via cURL
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'X-API-Key: ' . $api_key
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Log the request
    $log = new stdClass();
    $log->courseid = $courseid;
    $log->userid = $userid;
    $log->problemid = $problem_id;
    $log->response_code = $http_code;
    $log->timecreated = time();

    return json_decode($response);
}

/**
 * Get student progress from Number Constellation app
 *
 * @param string $problemid Problem ID
 * @param int $userid Moodle user ID
 * @return object Student progress data
 */
function local_numconstellation_get_progress($problemid, $userid) {
    $api_url = get_config('local_numconstellation', 'api_url');
    if (empty($api_url)) {
        $api_url = 'http://localhost:8080/api/progress.php';
    }

    $api_key = get_config('local_numconstellation', 'api_key');

    $url = $api_url . '?problem_id=' . urlencode($problemid) . '&user_id=' . urlencode($userid);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'X-API-Key: ' . $api_key
    ));

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response);
}

/**
 * Generate app URL with problem data
 *
 * @param string $problemid Problem ID
 * @param int $userid Moodle user ID
 * @return string URL to Number Constellation app
 */
function local_numconstellation_get_app_url($problemid, $userid) {
    $app_url = get_config('local_numconstellation', 'app_url');
    if (empty($app_url)) {
        $app_url = 'http://localhost:8080';
    }

    return $app_url . '?problem_id=' . urlencode($problemid) . '&user_id=' . urlencode($userid);
}
