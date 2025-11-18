<?php
/**
 * Delete a problem
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$cmid = required_param('cmid', PARAM_INT);
$problemid = required_param('problemid', PARAM_INT);
$confirm = optional_param('confirm', 0, PARAM_INT);

$cm = get_coursemodule_from_id('coreconditions', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$coreconditions = $DB->get_record('coreconditions', array('id' => $cm->instance), '*', MUST_EXIST);
$problem = $DB->get_record('coreconditions_problems', array('id' => $problemid), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/coreconditions:manageconditions', $context);

$returnurl = new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid));

if ($confirm && confirm_sesskey()) {
    // Delete all related data
    $DB->delete_records('coreconditions_attempts', array('problem_id' => $problemid));
    $DB->delete_records('coreconditions_conditions', array('problem_id' => $problemid));
    $DB->delete_records('coreconditions_problems', array('id' => $problemid));

    redirect($returnurl, 'Problem deleted successfully', null, \core\output\notification::NOTIFY_SUCCESS);
}

$PAGE->set_url('/mod/coreconditions/delete_problem.php', array('cmid' => $cmid, 'problemid' => $problemid));
$PAGE->set_title(get_string('deleteproblem', 'coreconditions'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('deleteproblem', 'coreconditions'));

echo $OUTPUT->confirm(
    'Are you sure you want to delete the problem "' . format_string($problem->name) . '"? This will also delete all associated conditions and student attempts.',
    new moodle_url('/mod/coreconditions/delete_problem.php',
        array('cmid' => $cmid, 'problemid' => $problemid, 'confirm' => 1, 'sesskey' => sesskey())),
    $returnurl
);

echo $OUTPUT->footer();
