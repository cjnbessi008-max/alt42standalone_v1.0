<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * This page lists all the instances of invariantfinder in a particular course
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT);   // course

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$coursecontext = context_course::instance($course->id);

// Trigger course_module_instance_list_viewed event
$event = \mod_invariantfinder\event\course_module_instance_list_viewed::create(array(
    'context' => $coursecontext
));
$event->add_record_snapshot('course', $course);
$event->trigger();

$PAGE->set_url('/mod/invariantfinder/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($coursecontext);

echo $OUTPUT->header();

if (!$invariantfinders = get_all_instances_in_course('invariantfinder', $course)) {
    notice(get_string('noinstances', 'invariantfinder'), new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head  = array(get_string('name'), get_string('shapetype', 'invariantfinder'));
$table->align = array('left', 'left');

foreach ($invariantfinders as $invariantfinder) {
    $link = html_writer::link(
        new moodle_url('/mod/invariantfinder/view.php', array('id' => $invariantfinder->coursemodule)),
        format_string($invariantfinder->name)
    );

    $shapetype = get_string($invariantfinder->shape_type, 'invariantfinder');

    $table->data[] = array($link, $shapetype);
}

echo html_writer::table($table);

echo $OUTPUT->footer();
