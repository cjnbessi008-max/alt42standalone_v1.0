<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Handle answer submissions
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once(__DIR__ . '/classes/problem.php');

use mod_multiperspective\problem;

// Get parameters
$cmid = required_param('id', PARAM_INT);
$problemid = required_param('problemid', PARAM_INT);
$answer = required_param('answer', PARAM_RAW);
$perspectives_viewed = optional_param('perspectives_viewed', '[]', PARAM_RAW);

require_sesskey();

// Get course module and related records
$cm = get_coursemodule_from_id('multiperspective', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$multiperspective = $DB->get_record('multiperspective', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, false, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/multiperspective:submit', $context);

// Load the problem
$problem = new problem($problemid);

// Validate that problem belongs to this activity
if ($problem->get_multiperspectiveid() != $multiperspective->id) {
    print_error('invalidproblem', 'mod_multiperspective');
}

// Check attempt limits
$attempt_count = $DB->count_records('multiperspective_attempts', array(
    'problemid' => $problemid,
    'userid' => $USER->id
));

if ($multiperspective->max_attempts > 0 && $attempt_count >= $multiperspective->max_attempts) {
    redirect(new moodle_url('/mod/multiperspective/view.php', array('id' => $cmid, 'p' => $problemid)),
        get_string('error_maxattempts', 'mod_multiperspective'),
        null,
        \core\output\notification::NOTIFY_ERROR);
}

// Decode perspectives viewed
$perspectives_viewed_array = json_decode($perspectives_viewed, true);
if (!is_array($perspectives_viewed_array)) {
    $perspectives_viewed_array = array();
}

// Validate perspective requirements
$total_perspectives = count($problem->get_perspectives());
$viewed_count = count($perspectives_viewed_array);

if ($multiperspective->require_all_perspectives && $viewed_count < $total_perspectives) {
    redirect(new moodle_url('/mod/multiperspective/view.php', array('id' => $cmid, 'p' => $problemid)),
        get_string('error_allperspectives', 'mod_multiperspective'),
        null,
        \core\output\notification::NOTIFY_ERROR);
}

if ($viewed_count < $multiperspective->min_perspectives) {
    redirect(new moodle_url('/mod/multiperspective/view.php', array('id' => $cmid, 'p' => $problemid)),
        get_string('error_minperspectives', 'mod_multiperspective', $multiperspective->min_perspectives),
        null,
        \core\output\notification::NOTIFY_ERROR);
}

// Check the answer
$result = $problem->check_answer($answer);

// Calculate time spent (would need JavaScript tracking for accurate measurement)
// For now, use a simple heuristic
$time_spent = 0;
$last_view = $DB->get_record_sql(
    "SELECT MAX(last_viewed) as last_time FROM {multiperspective_views}
     WHERE problemid = ? AND userid = ?",
    array($problemid, $USER->id)
);
if ($last_view && $last_view->last_time) {
    $time_spent = time() - $last_view->last_time;
    // Cap at 1 hour to avoid unrealistic values
    if ($time_spent > 3600) {
        $time_spent = 3600;
    }
}

// Record the attempt
$attempt = new stdClass();
$attempt->multiperspectiveid = $multiperspective->id;
$attempt->problemid = $problemid;
$attempt->userid = $USER->id;
$attempt->attempt_number = $attempt_count + 1;
$attempt->answer = $answer;
$attempt->is_correct = $result['is_correct'] ? 1 : 0;
$attempt->score = $result['score'];
$attempt->perspectives_viewed = json_encode($perspectives_viewed_array);
$attempt->time_spent = $time_spent;
$attempt->feedback = $result['feedback'];
$attempt->timecreated = time();

$attempt_id = $DB->insert_record('multiperspective_attempts', $attempt);

// Update grades
multiperspective_update_grades($multiperspective, $USER->id);

// Log the event
$event = \mod_multiperspective\event\answer_submitted::create(array(
    'objectid' => $attempt_id,
    'context' => $context,
    'other' => array(
        'problemid' => $problemid,
        'score' => $result['score'],
        'is_correct' => $result['is_correct']
    )
));
$event->trigger();

// Redirect back with feedback
$message = $result['feedback'];
$messagetype = $result['is_correct'] ?
    \core\output\notification::NOTIFY_SUCCESS :
    \core\output\notification::NOTIFY_WARNING;

redirect(new moodle_url('/mod/multiperspective/view.php', array('id' => $cmid, 'p' => $problemid)),
    $message,
    null,
    $messagetype);
