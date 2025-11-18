<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX endpoint to log sound usage
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/asmr/classes/analytics.php');
require_once($CFG->dirroot . '/local/asmr/classes/sound_manager.php');

require_login();

$soundid = required_param('soundid', PARAM_INT);
$action = required_param('action', PARAM_ALPHA);
$duration = optional_param('duration', 0, PARAM_INT);
$courseid = optional_param('courseid', null, PARAM_INT);
$cmid = optional_param('cmid', null, PARAM_INT);
$volume = optional_param('volume', 70, PARAM_INT);

try {
    // Validate action
    $allowed_actions = array(
        \local_asmr\analytics::ACTION_PLAY,
        \local_asmr\analytics::ACTION_PAUSE,
        \local_asmr\analytics::ACTION_STOP,
        \local_asmr\analytics::ACTION_SKIP,
        \local_asmr\analytics::ACTION_COMPLETE
    );

    if (!in_array($action, $allowed_actions)) {
        throw new moodle_exception('Invalid action');
    }

    // Verify sound exists
    $sound = \local_asmr\sound_manager::get_sound($soundid);
    if (!$sound) {
        throw new moodle_exception('Sound not found');
    }

    // Log usage
    $options = array(
        'courseid' => $courseid,
        'cmid' => $cmid,
        'volume' => $volume
    );

    $logid = \local_asmr\analytics::log_usage($USER->id, $soundid, $action, $duration, $options);

    // If this is a play action, increment play count
    if ($action === \local_asmr\analytics::ACTION_PLAY) {
        \local_asmr\sound_manager::increment_playcount($soundid);
    }

    echo json_encode(array(
        'success' => true,
        'logid' => $logid
    ));

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
