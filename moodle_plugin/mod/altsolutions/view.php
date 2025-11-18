<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Prints a particular instance of altsolutions
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Course module id.
$id = optional_param('id', 0, PARAM_INT);

// Activity instance id.
$a = optional_param('a', 0, PARAM_INT);

if ($id) {
    $cm = get_coursemodule_from_id('altsolutions', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $altsolutions = $DB->get_record('altsolutions', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    $altsolutions = $DB->get_record('altsolutions', array('id' => $a), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $altsolutions->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('altsolutions', $altsolutions->id, $course->id, false, MUST_EXIST);
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/altsolutions:view', $context);

// Trigger module viewed event.
$event = \mod_altsolutions\event\course_module_viewed::create(array(
    'objectid' => $altsolutions->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('altsolutions', $altsolutions);
$event->add_record_snapshot('course_modules', $cm);
$event->trigger();

// Set up the page.
$PAGE->set_url('/mod/altsolutions/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($altsolutions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($altsolutions->name));

// Show intro/description.
if (trim(strip_tags($altsolutions->intro))) {
    echo $OUTPUT->box_start('mod_introbox', 'altsolutionsintro');
    echo format_module_intro('altsolutions', $altsolutions, $cm->id);
    echo $OUTPUT->box_end();
}

// Show problem statement.
echo $OUTPUT->box_start('generalbox boxaligncenter', 'problem');
echo $OUTPUT->heading(get_string('problemtext', 'altsolutions'), 3);
echo format_text($altsolutions->problemtext, $altsolutions->problemformat);
echo $OUTPUT->box_end();

// Get user progress.
$progress = altsolutions_get_user_progress($altsolutions->id, $USER->id);

// Show progress.
echo $OUTPUT->box_start('generalbox', 'progress');
echo $OUTPUT->heading(get_string('yourprogress', 'altsolutions'), 3);

if ($progress->totalsteps == 0) {
    echo $OUTPUT->notification(get_string('error:nosteps', 'altsolutions'), 'notifyproblem');
} else {
    echo html_writer::tag('p',
        get_string('step', 'altsolutions') . ' ' . $progress->completedsteps . ' ' .
        get_string('of', 'altsolutions') . ' ' . $progress->totalsteps
    );

    // Progress bar.
    echo html_writer::start_div('progress');
    echo html_writer::start_div('progress-bar', array(
        'role' => 'progressbar',
        'style' => 'width: ' . $progress->percentage . '%',
        'aria-valuenow' => $progress->percentage,
        'aria-valuemin' => '0',
        'aria-valuemax' => '100'
    ));
    echo $progress->percentage . '%';
    echo html_writer::end_div();
    echo html_writer::end_div();

    // Action button.
    if ($progress->completedsteps == 0) {
        $buttontext = get_string('startsolving', 'altsolutions');
        $url = new moodle_url('/mod/altsolutions/solve.php', array('id' => $cm->id, 'step' => 1));
    } else if ($progress->completedsteps < $progress->totalsteps) {
        $buttontext = get_string('continuesolving', 'altsolutions');
        $url = new moodle_url('/mod/altsolutions/solve.php', array('id' => $cm->id, 'step' => $progress->completedsteps + 1));
    } else if (!$progress->hasreflection) {
        $buttontext = get_string('completereflection', 'altsolutions');
        $url = new moodle_url('/mod/altsolutions/reflection.php', array('id' => $cm->id));
    } else {
        $buttontext = get_string('summary', 'altsolutions');
        $url = new moodle_url('/mod/altsolutions/summary.php', array('id' => $cm->id));
    }

    echo html_writer::tag('p',
        html_writer::link($url, $buttontext, array('class' => 'btn btn-primary'))
    );
}

echo $OUTPUT->box_end();

// Show teacher view if user has edit capability.
if (has_capability('mod/altsolutions:addinstance', $context)) {
    echo $OUTPUT->box_start('generalbox', 'teacherview');
    echo $OUTPUT->heading(get_string('teacherview', 'altsolutions'), 3);

    $manageurl = new moodle_url('/mod/altsolutions/managesteps.php', array('id' => $cm->id));
    echo html_writer::link($manageurl, get_string('managesteps', 'altsolutions'), array('class' => 'btn btn-secondary'));

    $progressurl = new moodle_url('/mod/altsolutions/report.php', array('id' => $cm->id));
    echo ' ' . html_writer::link($progressurl, get_string('studentprogress', 'altsolutions'), array('class' => 'btn btn-secondary'));

    echo $OUTPUT->box_end();
}

echo $OUTPUT->footer();
