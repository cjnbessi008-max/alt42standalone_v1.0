<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AJAX endpoint for tracking events
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');

require_login();
require_sesskey();

global $DB, $USER;

// Get posted data
$rawdata = optional_param('data', '', PARAM_RAW);

if (empty($rawdata)) {
    http_response_code(400);
    die(json_encode(['error' => 'No data provided']));
}

$data = json_decode($rawdata, true);

if (!$data || !isset($data['events'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid data format']));
}

// Verify user matches
if ($data['userid'] != $USER->id) {
    http_response_code(403);
    die(json_encode(['error' => 'User mismatch']));
}

// Insert events into database
$success_count = 0;
$error_count = 0;

foreach ($data['events'] as $event) {
    try {
        $record = new stdClass();
        $record->userid = $data['userid'];
        $record->courseid = $data['courseid'];
        $record->cmid = $data['cmid'] ?? 0;
        $record->attemptid = $data['attemptid'] ?? null;
        $record->questionid = $data['questionid'] ?? null;
        $record->eventtype = clean_param($event['eventtype'], PARAM_ALPHANUMEXT);
        $record->eventdata = $event['eventdata'];
        $record->timespent = $event['timespent'] ?? null;
        $record->timestamp = $event['timestamp'];
        $record->timecreated = time();

        $DB->insert_record('local_flowmoments_tracking', $record);
        $success_count++;
    } catch (Exception $e) {
        $error_count++;
        debugging('Failed to insert flow tracking event: ' . $e->getMessage(), DEBUG_NORMAL);
    }
}

// Return response
echo json_encode([
    'success' => true,
    'inserted' => $success_count,
    'errors' => $error_count,
]);
