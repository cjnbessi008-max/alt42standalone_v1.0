<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX handler for saving student priority selections.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');

// Get parameters
$userid = required_param('userid', PARAM_INT);
$courseid = required_param('courseid', PARAM_INT);
$priority_step = required_param('priority_step', PARAM_INT);
$step_name = optional_param('step_name', '', PARAM_TEXT);
$reason = optional_param('reason', '', PARAM_TEXT);

// Verify session key
require_sesskey();

// Verify login
require_login();

$context = context_course::instance($courseid);

// Return JSON response
header('Content-Type: application/json');

try {
    // Verify user permissions
    if ($USER->id != $userid) {
        throw new moodle_exception('error_permission', 'block_student_priority');
    }

    // Check capability
    if (!has_capability('block/student_priority:setpriority', $context)) {
        throw new moodle_exception('error_permission', 'block_student_priority');
    }

    // Validate priority step
    if ($priority_step < 1 || $priority_step > 100) {
        throw new moodle_exception('error_invalid_step', 'block_student_priority');
    }

    // Check if record exists
    $existing = $DB->get_record('block_student_priority', array(
        'userid' => $userid,
        'courseid' => $courseid
    ));

    $time = time();

    if ($existing) {
        // Check if changes are allowed
        $block_config = get_config('block_student_priority');
        if (isset($block_config->allow_change) && !$block_config->allow_change) {
            throw new moodle_exception('error_no_change_allowed', 'block_student_priority');
        }

        // Log the change
        $log = new stdClass();
        $log->userid = $userid;
        $log->courseid = $courseid;
        $log->old_priority_step = $existing->priority_step;
        $log->new_priority_step = $priority_step;
        $log->reason = $reason;
        $log->timecreated = $time;
        $DB->insert_record('block_student_priority_log', $log);

        // Update existing record
        $existing->priority_step = $priority_step;
        $existing->step_name = $step_name;
        $existing->reason = $reason;
        $existing->timemodified = $time;
        $DB->update_record('block_student_priority', $existing);

        $message = get_string('priority_updated', 'block_student_priority');
    } else {
        // Insert new record
        $record = new stdClass();
        $record->userid = $userid;
        $record->courseid = $courseid;
        $record->priority_step = $priority_step;
        $record->step_name = $step_name;
        $record->reason = $reason;
        $record->timecreated = $time;
        $record->timemodified = $time;
        $DB->insert_record('block_student_priority', $record);

        // Also log the initial selection
        $log = new stdClass();
        $log->userid = $userid;
        $log->courseid = $courseid;
        $log->old_priority_step = null;
        $log->new_priority_step = $priority_step;
        $log->reason = $reason;
        $log->timecreated = $time;
        $DB->insert_record('block_student_priority_log', $log);

        $message = get_string('priority_saved', 'block_student_priority');
    }

    // Trigger event
    $event = \block_student_priority\event\priority_selected::create(array(
        'context' => $context,
        'objectid' => $priority_step,
        'relateduserid' => $userid,
        'other' => array(
            'courseid' => $courseid,
            'step_name' => $step_name
        )
    ));
    $event->trigger();

    // Return success response
    echo json_encode(array(
        'success' => true,
        'message' => $message,
        'priority_step' => $priority_step,
        'step_name' => $step_name
    ));

} catch (Exception $e) {
    // Return error response
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ));
}
