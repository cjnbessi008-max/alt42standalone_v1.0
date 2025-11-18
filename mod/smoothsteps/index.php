<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT);   // course

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$coursecontext = context_course::instance($course->id);

$event = \mod_smoothsteps\event\course_module_instance_list_viewed::create(array(
    'context' => $coursecontext
));
$event->add_record_snapshot('course', $course);
$event->trigger();

$PAGE->set_url('/mod/smoothsteps/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($coursecontext);

echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('modulenameplural', 'smoothsteps'));

if (!$smoothstepsinstances = get_all_instances_in_course('smoothsteps', $course)) {
    notice(get_string('nosmoothsteps', 'smoothsteps'), new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head = array(
    get_string('name'),
    get_string('intro', 'smoothsteps')
);
$table->align = array('left', 'left');

foreach ($smoothstepsinstances as $smoothsteps) {
    $tt = '';
    if (!$smoothsteps->visible) {
        $tt = 'class="dimmed"';
    }

    $table->data[] = array(
        "<a $tt href=\"view.php?id=$smoothsteps->coursemodule\">".format_string($smoothsteps->name)."</a>",
        format_module_intro('smoothsteps', $smoothsteps, $smoothsteps->coursemodule)
    );
}

echo html_writer::table($table);

echo $OUTPUT->footer();
