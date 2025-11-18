<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Index page (list all instances in a course)
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT); // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_login($course);
$context = context_course::instance($course->id);

// Trigger course module instance list event
$event = \mod_minitrial\event\course_module_instance_list_viewed::create(array(
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/minitrial/index.php', array('id' => $course->id));
$PAGE->set_title($course->shortname . ': ' . get_string('modulenameplural', 'minitrial'));
$PAGE->set_heading($course->fullname);
$PAGE->set_context($context);
$PAGE->navbar->add(get_string('modulenameplural', 'minitrial'));

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('modulenameplural', 'minitrial'));

// Get all minitrials in this course
$minitrials = $DB->get_records('minitrial', array('course' => $course->id), 'name');

if (empty($minitrials)) {
    echo $OUTPUT->notification(get_string('nominitrialsincourse', 'minitrial'), 'info');
    echo $OUTPUT->footer();
    exit;
}

// Display table
$table = new html_table();
$table->head = array(
    get_string('name'),
    get_string('gametype', 'minitrial'),
    get_string('trialsrequired', 'minitrial')
);
$table->align = array('left', 'left', 'center');

foreach ($minitrials as $minitrial) {
    $cm = get_coursemodule_from_instance('minitrial', $minitrial->id);

    if (!$cm->visible) {
        // Hidden activity
        $link = html_writer::link(
            new moodle_url('/mod/minitrial/view.php', array('id' => $cm->id)),
            format_string($minitrial->name),
            array('class' => 'dimmed')
        );
    } else {
        $link = html_writer::link(
            new moodle_url('/mod/minitrial/view.php', array('id' => $cm->id)),
            format_string($minitrial->name)
        );
    }

    $gametype = get_string('gametype_' . $minitrial->game_type, 'minitrial');

    $table->data[] = array($link, $gametype, $minitrial->trials_required);
}

echo html_writer::table($table);

echo $OUTPUT->footer();
