<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');

$id = required_param('id', PARAM_INT); // Course ID

if (!$course = $DB->get_record('course', array('id' => $id))) {
    print_error('invalidcourseid');
}

require_login($course);
$PAGE->set_pagelayout('incourse');

// Log this view
$params = array(
    'context' => context_course::instance($course->id)
);
$event = \mod_3dlineseq\event\course_module_instance_list_viewed::create($params);
$event->add_record_snapshot('course', $course);
$event->trigger();

// Set up page
$strname = get_string('modulenameplural', '3dlineseq');
$PAGE->set_url('/mod/3dlineseq/index.php', array('id' => $course->id));
$PAGE->set_title($course->shortname.': '.$strname);
$PAGE->set_heading($course->fullname);
$PAGE->navbar->add($strname);

// Get all instances
$moduleinstances = get_all_instances_in_course('3dlineseq', $course);

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading($strname);

if (empty($moduleinstances)) {
    notice(get_string('thereareno', 'moodle', $strname), "$CFG->wwwroot/course/view.php?id=$course->id");
    exit;
}

// Build table
$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head = array(
    get_string('name'),
    get_string('sequencetype', '3dlineseq'),
    get_string('visualstyle', '3dlineseq')
);
$table->align = array('left', 'left', 'left');

foreach ($moduleinstances as $instance) {
    $url = new moodle_url('/mod/3dlineseq/view.php', array('id' => $instance->coursemodule));
    $name = html_writer::link($url, format_string($instance->name));

    $type = get_string($instance->sequencetype, '3dlineseq');
    $style = get_string($instance->visualstyle, '3dlineseq');

    $table->data[] = array($name, $type, $style);
}

echo html_writer::table($table);
echo $OUTPUT->footer();
