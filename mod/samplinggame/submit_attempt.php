<?php
// This file is part of Moodle - http://moodle.org/

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(array('success' => false, 'message' => 'Method not allowed')));
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    die(json_encode(array('success' => false, 'message' => 'Invalid JSON')));
}

// Validate required fields
$required_fields = array('samplinggameid', 'userid', 'selectedsamples', 'score', 'timespent', 'sesskey');
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        die(json_encode(array('success' => false, 'message' => 'Missing field: ' . $field)));
    }
}

$samplinggameid = (int)$data['samplinggameid'];
$userid = (int)$data['userid'];
$selectedsamples = $data['selectedsamples'];
$score = (float)$data['score'];
$timespent = (int)$data['timespent'];
$sesskey = $data['sesskey'];

// Verify session key
if (!confirm_sesskey($sesskey)) {
    http_response_code(403);
    die(json_encode(array('success' => false, 'message' => 'Invalid session key')));
}

// Require login
require_login();

// Verify user
if ($USER->id != $userid) {
    http_response_code(403);
    die(json_encode(array('success' => false, 'message' => 'User mismatch')));
}

// Get samplinggame instance
$samplinggame = $DB->get_record('samplinggame', array('id' => $samplinggameid), '*', MUST_EXIST);

// Get course module
$cm = get_coursemodule_from_instance('samplinggame', $samplinggame->id, $samplinggame->course, false, MUST_EXIST);

// Check capability
$context = context_module::instance($cm->id);
require_capability('mod/samplinggame:submit', $context);

try {
    // Save attempt
    $attemptid = samplinggame_save_attempt(
        $samplinggameid,
        $userid,
        $selectedsamples,
        $score,
        $timespent
    );

    // Get feedback
    $attempt = $DB->get_record('samplinggame_attempts', array('id' => $attemptid), '*', MUST_EXIST);

    // Trigger event
    $event = \mod_samplinggame\event\attempt_submitted::create(array(
        'objectid' => $attemptid,
        'context' => $context,
        'relateduserid' => $userid,
        'other' => array(
            'samplinggameid' => $samplinggameid,
            'score' => $score
        )
    ));
    $event->trigger();

    // Return success
    header('Content-Type: application/json');
    echo json_encode(array(
        'success' => true,
        'attemptid' => $attemptid,
        'score' => $score,
        'feedback' => $attempt->feedback,
        'message' => get_string('attemptsaved', 'mod_samplinggame')
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Error saving attempt: ' . $e->getMessage()
    ));
}
