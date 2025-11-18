<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$action = required_param('action', PARAM_ALPHA);
$cmid = required_param('cmid', PARAM_INT);

$cm = get_coursemodule_from_id('smoothsteps', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$smoothsteps = $DB->get_record('smoothsteps', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
require_sesskey();

$context = context_module::instance($cm->id);
require_capability('mod/smoothsteps:view', $context);

header('Content-Type: application/json');

$response = array('success' => false, 'data' => null, 'error' => null);

try {
    switch ($action) {
        case 'get_problem':
            // Get problem data for the current distribution type
            $problem = smoothsteps_generate_problem($smoothsteps);
            $response['success'] = true;
            $response['data'] = $problem;
            break;

        case 'save_progress':
            // Save user progress
            $attempt = required_param('attempt', PARAM_INT);
            $correct = required_param('correct', PARAM_INT);
            $timespent = required_param('timespent', PARAM_INT);

            $progress = new stdClass();
            $progress->smoothstepsid = $smoothsteps->id;
            $progress->userid = $USER->id;
            $progress->attempt = $attempt;
            $progress->correct = $correct;
            $progress->timespent = $timespent;
            $progress->timecreated = time();

            $DB->insert_record('smoothsteps_progress', $progress);

            $response['success'] = true;
            $response['data'] = array('saved' => true);
            break;

        case 'get_progress':
            // Get user's progress
            $progress = $DB->get_records('smoothsteps_progress',
                array('smoothstepsid' => $smoothsteps->id, 'userid' => $USER->id),
                'timecreated DESC', '*', 0, 10);

            $response['success'] = true;
            $response['data'] = array_values($progress);
            break;

        case 'get_stats':
            // Get statistics for the activity
            $stats = smoothsteps_get_user_stats($smoothsteps->id, $USER->id);
            $response['success'] = true;
            $response['data'] = $stats;
            break;

        case 'log_interaction':
            // Log user interaction
            $interactiontype = required_param('type', PARAM_ALPHA);
            $interactiondata = optional_param('data', '', PARAM_RAW);

            $interaction = new stdClass();
            $interaction->smoothstepsid = $smoothsteps->id;
            $interaction->userid = $USER->id;
            $interaction->interactiontype = $interactiontype;
            $interaction->interactiondata = $interactiondata;
            $interaction->timecreated = time();

            $DB->insert_record('smoothsteps_interactions', $interaction);

            $response['success'] = true;
            $response['data'] = array('logged' => true);
            break;

        default:
            throw new moodle_exception('invalidaction', 'smoothsteps');
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
