<?php
// This file is part of Moodle - http://moodle.org/
//
// List all Sequence Pearls activities in a course

require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_login($course);
$PAGE->set_url('/mod/sequencepearls/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_pagelayout('incourse');

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('modulenameplural', 'sequencepearls'));

$sequencepearls = get_all_instances_in_course('sequencepearls', $course);

if (empty($sequencepearls)) {
    notice(get_string('thereareno', 'moodle', get_string('modulenameplural', 'sequencepearls')),
        new moodle_url('/course/view.php', array('id' => $course->id)));
    exit;
}

$table = new html_table();
$table->head = array(
    get_string('name'),
    get_string('sequence_type', 'sequencepearls'),
    get_string('difficulty', 'sequencepearls')
);
$table->align = array('left', 'center', 'center');

foreach ($sequencepearls as $sp) {
    $link = html_writer::link(
        new moodle_url('/mod/sequencepearls/view.php', array('id' => $sp->coursemodule)),
        format_string($sp->name)
    );

    $sequenceType = get_string($sp->sequence_type, 'sequencepearls');
    $difficulty = $sp->difficulty;

    $table->data[] = array($link, $sequenceType, $difficulty);
}

echo html_writer::table($table);
echo $OUTPUT->footer();
