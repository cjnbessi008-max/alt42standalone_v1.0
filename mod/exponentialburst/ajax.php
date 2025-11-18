<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX handler for mod_exponentialburst
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

require_login();

// Get JSON input
$jsondata = file_get_contents('php://input');
$data = json_decode($jsondata);

if (!$data) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array('error' => 'Invalid JSON data'));
    exit;
}

// Verify user has permission
$context = context_module::instance($data->cmid);
require_capability('mod/exponentialburst:submit', $context);

try {
    // Create attempt record
    $attempt = new stdClass();
    $attempt->exponentialburstid = $data->exponentialburstid;
    $attempt->userid = $USER->id;
    $attempt->questionid = $data->questionid;
    $attempt->answer = $data->answer;
    $attempt->iscorrect = $data->iscorrect;
    $attempt->timespent = $data->timespent;
    $attempt->visualdata = $data->visualdata;
    $attempt->timecreated = time();

    // Count previous attempts for this question
    $attemptnum = $DB->count_records('exponentialburst_attempts', array(
        'exponentialburstid' => $data->exponentialburstid,
        'userid' => $USER->id,
        'questionid' => $data->questionid
    )) + 1;

    $attempt->attemptnum = $attemptnum;

    // Record the attempt
    $attemptid = exponentialburst_record_attempt($attempt);

    // Update progress
    $progress = exponentialburst_get_progress($data->exponentialburstid, $USER->id);
    exponentialburst_update_progress($progress->id, $data->iscorrect, $data->timespent);

    // Return success
    header('Content-Type: application/json');
    echo json_encode(array(
        'success' => true,
        'attemptid' => $attemptid,
        'progress' => array(
            'currentlevel' => $progress->currentlevel,
            'totalbursts' => $progress->totalbursts + ($data->iscorrect ? 1 : 0),
            'bestscore' => $progress->bestscore
        )
    ));

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array('error' => $e->getMessage()));
}
