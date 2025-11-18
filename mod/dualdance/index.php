<?php
// This file is part of Moodle - http://moodle.org/

/**
 * This is a one-line short description of the file
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT);   // course

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$coursecontext = context_course::instance($course->id);

$event = \mod_dualdance\event\course_module_instance_list_viewed::create(array(
    'context' => context_course::instance($course->id)
));
$event->add_record_snapshot('course', $course);
$event->trigger();

$PAGE->set_url('/mod/dualdance/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($coursecontext);

echo $OUTPUT->header();

$modulenameplural = get_string('modulenameplural', 'dualdance');
echo $OUTPUT->heading($modulenameplural);

if (! $dualdances = get_all_instances_in_course('dualdance', $course)) {
    notice(get_string('no$dualdanceinstances', 'dualdance'), new moodle_url('/course/view.php', array('id' => $course->id)));
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

foreach ($dualdances as $dualdance) {
    if (!$dualdance->visible) {
        $link = html_writer::link(
            new moodle_url('/mod/dualdance/view.php', array('id' => $dualdance->coursemodule)),
            format_string($dualdance->name, true),
            array('class' => 'dimmed'));
    } else {
        $link = html_writer::link(
            new moodle_url('/mod/dualdance/view.php', array('id' => $dualdance->coursemodule)),
            format_string($dualdance->name, true));
    }

    if ($course->format == 'weeks' or $course->format == 'topics') {
        $table->data[] = array($dualdance->section, $link);
    } else {
        $table->data[] = array($link);
    }
}

echo html_writer::table($table);
echo $OUTPUT->footer();
