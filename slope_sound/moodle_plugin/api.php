<?php
// This file is part of Moodle - http://moodle.org/
//
// Slope Sound API endpoint for web app integration

require_once('../../../config.php');
require_once($CFG->dirroot . '/local/slopesound/classes/problem_manager.php');
require_once($CFG->dirroot . '/local/slopesound/classes/attempt_manager.php');

// Require login
require_login();

// Set up page context
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/slopesound/api.php'));

// Get request parameters
$action = required_param('action', PARAM_ALPHA);

// Set JSON header
header('Content-Type: application/json');

try {
    switch ($action) {
        case 'get_problem':
            $problemid = required_param('id', PARAM_INT);
            $problem = \local_slopesound\problem_manager::get_problem($problemid);
            echo json_encode(['success' => true, 'data' => $problem]);
            break;

        case 'get_problems':
            $quizid = optional_param('quiz_id', null, PARAM_INT);
            $problems = \local_slopesound\problem_manager::get_problems($quizid);
            echo json_encode(['success' => true, 'data' => $problems]);
            break;

        case 'start_attempt':
            $problemid = required_param('problem_id', PARAM_INT);
            $attemptid = \local_slopesound\attempt_manager::create_attempt($problemid, $USER->id);
            echo json_encode(['success' => true, 'attempt_id' => $attemptid]);
            break;

        case 'log_audio_event':
            $attemptid = required_param('attempt_id', PARAM_INT);
            $xvalue = required_param('x_value', PARAM_FLOAT);
            $slope = required_param('slope_value', PARAM_FLOAT);
            $frequency = required_param('frequency_hz', PARAM_INT);

            \local_slopesound\attempt_manager::log_audio_event(
                $attemptid, $xvalue, $slope, $frequency
            );
            echo json_encode(['success' => true]);
            break;

        case 'update_attempt':
            $attemptid = required_param('attempt_id', PARAM_INT);
            $pointsexplored = optional_param('points_explored', '', PARAM_TEXT);
            $timespent = optional_param('time_spent', 0, PARAM_INT);
            $completed = optional_param('completed', 0, PARAM_INT);
            $score = optional_param('score', null, PARAM_FLOAT);

            \local_slopesound\attempt_manager::update_attempt(
                $attemptid, $pointsexplored, $timespent, $completed, $score
            );
            echo json_encode(['success' => true]);
            break;

        case 'get_user_progress':
            $problemid = optional_param('problem_id', null, PARAM_INT);
            $progress = \local_slopesound\attempt_manager::get_user_attempts($USER->id, $problemid);
            echo json_encode(['success' => true, 'data' => $progress]);
            break;

        default:
            throw new moodle_exception('invalidaction', 'local_slopesound');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
