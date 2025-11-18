<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Save problem data
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/classes/problem.php');

use mod_multiperspective\problem;

require_sesskey();

$cmid = required_param('id', PARAM_INT);
$problemid = optional_param('problemid', 0, PARAM_INT);
$title = required_param('title', PARAM_TEXT);
$description = required_param('description', PARAM_RAW);
$problem_type = required_param('problem_type', PARAM_ALPHA);
$correct_answer = optional_param('correct_answer', '', PARAM_RAW);
$difficulty_level = required_param('difficulty_level', PARAM_INT);

// Get course module and check permissions
$cm = get_coursemodule_from_id('multiperspective', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$multiperspective = $DB->get_record('multiperspective', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, false, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/multiperspective:manage', $context);

// Create or update problem
if ($problemid > 0) {
    $problem = new problem($problemid);
    if ($problem->get_multiperspectiveid() != $multiperspective->id) {
        print_error('invalidproblem', 'mod_multiperspective');
    }
} else {
    $problem = new problem();
    $problem->set_multiperspectiveid($multiperspective->id);
}

$problem->set_title($title);
$problem->set_description($description);
$problem->set_problem_type($problem_type);
$problem->set_correct_answer($correct_answer);
$problem->set_difficulty_level($difficulty_level);

$newproblemid = $problem->save();

redirect(new moodle_url('/mod/multiperspective/manage_problems.php',
    array('id' => $cmid, 'action' => 'editproblem', 'problemid' => $newproblemid)),
    get_string('changessproblem', 'mod_multiperspective'),
    null,
    \core\output\notification::NOTIFY_SUCCESS);
