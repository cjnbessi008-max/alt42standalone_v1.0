<?php
/**
 * Slope Sense - Main View Page
 */

require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course Module ID

$cm = get_coursemodule_from_id('slopesense', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$slopesense = $DB->get_record('slopesense', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/slopesense:view', $context);

// Completion
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Log view
$event = \mod_slopesense\event\course_module_viewed::create(array(
    'objectid' => $slopesense->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('slopesense', $slopesense);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/slopesense/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($slopesense->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

echo $OUTPUT->header();

// Display activity name and description
echo $OUTPUT->heading(format_string($slopesense->name));

if ($slopesense->intro) {
    echo $OUTPUT->box(format_module_intro('slopesense', $slopesense, $cm->id), 'generalbox', 'intro');
}

// Embed the Slope Sense application
$app_url = new moodle_url('/mod/slopesense/app/index.html', array(
    'course_id' => $course->id,
    'activity_id' => $cm->id,
    'user_id' => $USER->id,
    'token' => sesskey()
));

echo html_writer::tag('iframe', '', array(
    'src' => $app_url,
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0',
    'class' => 'slopesense-iframe'
));

echo $OUTPUT->footer();
