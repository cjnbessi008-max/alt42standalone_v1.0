<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - REST API Endpoints
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/adminlib.php');

// Require login
require_login();

// Get action parameter
$action = required_param('action', PARAM_ALPHA);

// Set JSON header
header('Content-Type: application/json');

try {
    switch ($action) {
        case 'get_optimal_problems':
            handle_get_optimal_problems();
            break;

        case 'record_attempt':
            handle_record_attempt();
            break;

        case 'get_student_dashboard':
            handle_get_student_dashboard();
            break;

        case 'get_course_statistics':
            handle_get_course_statistics();
            break;

        case 'adjust_difficulty':
            handle_adjust_difficulty();
            break;

        case 'get_recommendations':
            handle_get_recommendations();
            break;

        default:
            send_error('Invalid action', 400);
    }
} catch (Exception $e) {
    send_error($e->getMessage(), 500);
}

/**
 * Handle get_optimal_problems request
 */
function handle_get_optimal_problems() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if ($userid != $USER->id && !has_capability('local/aiproblemoptimizer:viewall', context_course::instance($courseid))) {
        send_error('Permission denied', 403);
        return;
    }

    // Verify course enrollment
    if (!is_enrolled(context_course::instance($courseid), $userid)) {
        send_error('User not enrolled in course', 403);
        return;
    }

    $result = \local_aiproblemoptimizer\optimizer::calculate_optimal_problems($userid, $courseid);

    send_success($result);
}

/**
 * Handle record_attempt request
 */
function handle_record_attempt() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if ($userid != $USER->id) {
        send_error('Cannot record attempts for other users', 403);
        return;
    }

    // Verify course enrollment
    if (!is_enrolled(context_course::instance($courseid), $userid)) {
        send_error('User not enrolled in course', 403);
        return;
    }

    // Get attempt data
    $attempt_data = [
        'userid' => $userid,
        'courseid' => $courseid,
        'quizid' => required_param('quizid', PARAM_INT),
        'questionid' => optional_param('questionid', null, PARAM_INT),
        'problem_type' => required_param('problem_type', PARAM_TEXT),
        'difficulty_level' => required_param('difficulty_level', PARAM_INT),
        'is_correct' => required_param('is_correct', PARAM_BOOL),
        'time_spent' => required_param('time_spent', PARAM_INT),
        'attempt_number' => optional_param('attempt_number', 1, PARAM_INT),
        'student_answer' => optional_param('student_answer', null, PARAM_TEXT),
        'correct_answer' => optional_param('correct_answer', null, PARAM_TEXT),
        'hint_used' => optional_param('hint_used', 0, PARAM_BOOL),
        'quiz_session_id' => optional_param('quiz_session_id', null, PARAM_TEXT)
    ];

    $result = \local_aiproblemoptimizer\metrics_tracker::record_attempt($attempt_data);

    send_success($result);
}

/**
 * Handle get_student_dashboard request
 */
function handle_get_student_dashboard() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if ($userid != $USER->id && !has_capability('local/aiproblemoptimizer:viewall', context_course::instance($courseid))) {
        send_error('Permission denied', 403);
        return;
    }

    // Verify course enrollment
    if (!is_enrolled(context_course::instance($courseid), $userid)) {
        send_error('User not enrolled in course', 403);
        return;
    }

    $dashboard = \local_aiproblemoptimizer\metrics_tracker::get_student_dashboard($userid, $courseid);

    send_success($dashboard);
}

/**
 * Handle get_course_statistics request
 */
function handle_get_course_statistics() {
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if (!has_capability('local/aiproblemoptimizer:viewstatistics', context_course::instance($courseid))) {
        send_error('Permission denied', 403);
        return;
    }

    $statistics = \local_aiproblemoptimizer\metrics_tracker::get_course_statistics($courseid);

    send_success($statistics);
}

/**
 * Handle adjust_difficulty request
 */
function handle_adjust_difficulty() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if ($userid != $USER->id && !has_capability('local/aiproblemoptimizer:manage', context_course::instance($courseid))) {
        send_error('Permission denied', 403);
        return;
    }

    $result = \local_aiproblemoptimizer\optimizer::adjust_difficulty_level($userid, $courseid);

    send_success($result);
}

/**
 * Handle get_recommendations request
 */
function handle_get_recommendations() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $courseid = required_param('courseid', PARAM_INT);

    // Check permissions
    if ($userid != $USER->id && !has_capability('local/aiproblemoptimizer:viewall', context_course::instance($courseid))) {
        send_error('Permission denied', 403);
        return;
    }

    $recommendations = \local_aiproblemoptimizer\optimizer::get_recommendations($userid, $courseid);

    send_success($recommendations);
}

/**
 * Send success response
 *
 * @param mixed $data Data to send
 */
function send_success($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ]);
    exit;
}

/**
 * Send error response
 *
 * @param string $message Error message
 * @param int $code HTTP status code
 */
function send_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code,
        'timestamp' => time()
    ]);
    exit;
}
