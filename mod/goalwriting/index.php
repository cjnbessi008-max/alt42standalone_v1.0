<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Display a list of all goalwriting instances in a course
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT); // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$PAGE->set_url('/mod/goalwriting/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context(context_course::instance($course->id));

echo $OUTPUT->header();

// Get all goalwriting instances in this course
$goalwritings = get_all_instances_in_course('goalwriting', $course);

if (empty($goalwritings)) {
    notice(get_string('thereareno', 'moodle', get_string('modulenameplural', 'goalwriting')),
        new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

if ($course->format == 'weeks') {
    $table->head  = array(get_string('week'), get_string('name'));
    $table->align = array('center', 'left');
} else if ($course->format == 'topics') {
    $table->head  = array(get_string('topic'), get_string('name'));
    $table->align = array('center', 'left');
} else {
    $table->head  = array(get_string('name'));
    $table->align = array('left');
}

foreach ($goalwritings as $goalwriting) {
    if (!$goalwriting->visible) {
        $link = html_writer::link(
            new moodle_url('/mod/goalwriting/view.php', array('id' => $goalwriting->coursemodule)),
            format_string($goalwriting->name, true),
            array('class' => 'dimmed')
        );
    } else {
        $link = html_writer::link(
            new moodle_url('/mod/goalwriting/view.php', array('id' => $goalwriting->coursemodule)),
            format_string($goalwriting->name, true)
        );
    }

    if ($course->format == 'weeks' or $course->format == 'topics') {
        $table->data[] = array($goalwriting->section, $link);
    } else {
        $table->data[] = array($link);
    }
}

echo html_writer::table($table);
echo $OUTPUT->footer();
