<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX handler for invariant finder interactions
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

require_login();
require_sesskey();

$action = required_param('action', PARAM_ALPHA);

switch ($action) {
    case 'log_interaction':
        $attemptid = required_param('attempt_id', PARAM_INT);
        $actiontype = required_param('action_type', PARAM_ALPHA);
        $actiondata = optional_param('action_data', '', PARAM_RAW);

        // Verify the attempt belongs to the current user
        $attempt = $DB->get_record('invariantfinder_attempts', array('id' => $attemptid), '*', MUST_EXIST);
        if ($attempt->userid != $USER->id) {
            header('HTTP/1.1 403 Forbidden');
            die('Access denied');
        }

        invariantfinder_log_interaction($attemptid, $actiontype, $actiondata);

        echo json_encode(array('status' => 'success'));
        break;

    case 'submit_attempt':
        $attemptid = required_param('attempt_id', PARAM_INT);
        $invariantsfound = required_param('invariants_found', PARAM_RAW);
        $scaleactions = required_param('scale_actions', PARAM_INT);
        $timespent = required_param('time_spent', PARAM_INT);
        $score = required_param('score', PARAM_FLOAT);

        // Verify the attempt belongs to the current user
        $attempt = $DB->get_record('invariantfinder_attempts', array('id' => $attemptid), '*', MUST_EXIST);
        if ($attempt->userid != $USER->id) {
            header('HTTP/1.1 403 Forbidden');
            die('Access denied');
        }

        // Update attempt
        $attempt->invariants_found = $invariantsfound;
        $attempt->scale_actions = $scaleactions;
        $attempt->time_spent = $timespent;
        $attempt->completed = 1;
        $attempt->score = $score;
        $attempt->timemodified = time();

        invariantfinder_save_attempt($attempt);

        // Update grade
        $invariantfinder = $DB->get_record('invariantfinder', array('id' => $attempt->invariantfinder), '*', MUST_EXIST);
        $grade = new stdClass();
        $grade->userid = $USER->id;
        $grade->rawgrade = $score;
        $grade->datesubmitted = time();

        invariantfinder_grade_item_update($invariantfinder, $grade);

        echo json_encode(array('status' => 'success', 'score' => $score));
        break;

    case 'get_progress':
        $attemptid = required_param('attempt_id', PARAM_INT);

        // Verify the attempt belongs to the current user
        $attempt = $DB->get_record('invariantfinder_attempts', array('id' => $attemptid), '*', MUST_EXIST);
        if ($attempt->userid != $USER->id) {
            header('HTTP/1.1 403 Forbidden');
            die('Access denied');
        }

        echo json_encode(array(
            'invariants_found' => $attempt->invariants_found,
            'scale_actions' => $attempt->scale_actions,
            'time_spent' => $attempt->time_spent,
            'score' => $attempt->score,
            'completed' => $attempt->completed
        ));
        break;

    default:
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(array('error' => 'Invalid action'));
        break;
}
