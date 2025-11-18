<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

define('AJAX_SCRIPT', true);

require_once('../../../config.php');

$courseid = required_param('courseid', PARAM_INT);
$conceptid = required_param('conceptid', PARAM_INT);
$score = required_param('score', PARAM_INT);
$comment = optional_param('comment', '', PARAM_TEXT);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_sesskey();
require_capability('local/confidence:submitconfidence', $context);

$response = array('success' => false, 'message' => '');

try {
    // Validate that concept belongs to this course
    $concept = $DB->get_record('local_confidence_concepts',
        array('id' => $conceptid, 'courseid' => $courseid),
        '*',
        MUST_EXIST
    );

    // Submit the score
    $result = \local_confidence\score_manager::submit_score(
        $USER->id,
        $conceptid,
        $score,
        $comment
    );

    if ($result) {
        $response['success'] = true;
        $response['message'] = get_string('confidencesaved', 'local_confidence');
    } else {
        $response['message'] = get_string('error:savefailed', 'local_confidence');
    }

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode($response);
