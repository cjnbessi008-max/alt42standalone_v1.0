<?php
// This file is part of Rule Patternizer

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/mod/rulepatternizer/lib.php');
require_once($CFG->dirroot . '/mod/rulepatternizer/classes/api.php');

use mod_rulepatternizer\api;

// Get parameters
$action = required_param('action', PARAM_ALPHA);
$instanceid = optional_param('instanceid', 0, PARAM_INT);

// Require login
require_login();

// Set up response header
header('Content-Type: application/json');

try {
    $response = array('success' => true);

    switch ($action) {
        case 'get_rules':
            $response['data'] = api::get_rules();
            break;

        case 'get_problem':
            $problemid = required_param('problemid', PARAM_INT);
            $response['data'] = api::get_problem($problemid);
            break;

        case 'get_random_problem':
            $ruleid = required_param('ruleid', PARAM_INT);
            $response['data'] = api::get_random_problem_for_rule($ruleid, $instanceid);
            break;

        case 'submit_answer':
            $problemid = required_param('problemid', PARAM_INT);
            $answer = required_param('answer', PARAM_RAW);
            $timetaken = optional_param('timetaken', 0, PARAM_INT);

            $response['data'] = api::submit_answer($USER->id, $instanceid, $problemid, $answer, $timetaken);
            break;

        case 'get_progress':
            $response['data'] = api::get_user_progress($USER->id, $instanceid);
            break;

        case 'get_next_problem':
            $response['data'] = api::get_next_problem($USER->id, $instanceid);
            break;

        case 'get_learning_insights':
            $response['data'] = api::get_learning_insights($USER->id, $instanceid);
            break;

        case 'get_study_plan':
            $session_length = optional_param('session_length', 5, PARAM_INT);
            $response['data'] = api::get_study_plan($USER->id, $instanceid, $session_length);
            break;

        default:
            $response['success'] = false;
            $response['error'] = 'Invalid action';
            break;
    }
} catch (Exception $e) {
    $response = array(
        'success' => false,
        'error' => $e->getMessage()
    );
}

echo json_encode($response);
