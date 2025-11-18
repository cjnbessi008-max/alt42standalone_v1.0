<?php
// This file is part of Moodle - http://moodle.org/
//
// Alt42 Module - View page

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course module ID

if ($id) {
    $cm = get_coursemodule_from_id('alt42', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $alt42 = $DB->get_record('alt42', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    error('You must specify a course_module ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

$event = \mod_alt42\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $alt42);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/alt42/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($alt42->name));
$PAGE->set_heading(format_string($course->fullname));

echo $OUTPUT->header();

// Display activity name
echo $OUTPUT->heading(format_string($alt42->name));

// Build Alt42 app URL with parameters
$serverurl = rtrim($alt42->serverurl, '/');
$appurl = $serverurl . '?' . http_build_query([
    'moodle_user_id' => $USER->id,
    'moodle_user_name' => fullname($USER),
    'moodle_course_id' => $course->id,
    'moodle_activity_id' => $alt42->id,
    'equation' => $alt42->equation,
    'difficulty' => $alt42->difficulty,
    'answer' => $alt42->answer
]);

// Display iframe with Alt42 app
echo html_writer::start_div('alt42-container', ['style' => 'width: 100%; height: 800px; border: none;']);
echo html_writer::tag('iframe', '', [
    'src' => $appurl,
    'style' => 'width: 100%; height: 100%; border: none;',
    'allowfullscreen' => true
]);
echo html_writer::end_div();

// Display activity information
echo html_writer::start_div('alt42-info', ['style' => 'margin-top: 20px;']);
echo html_writer::tag('h3', get_string('alt42settings', 'alt42'));
echo html_writer::tag('p', '<strong>' . get_string('equation', 'alt42') . ':</strong> ' . $alt42->equation);
echo html_writer::tag('p', '<strong>' . get_string('difficulty', 'alt42') . ':</strong> ' . get_string('difficulty_' . $alt42->difficulty, 'alt42'));

if ($alt42->maxattempts > 0) {
    echo html_writer::tag('p', '<strong>' . get_string('maxattempts', 'alt42') . ':</strong> ' . $alt42->maxattempts);
}

echo html_writer::end_div();

// Finish the page
echo $OUTPUT->footer();
