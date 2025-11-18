<?php
// This file is part of Moodle - http://moodle.org/

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);   // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_login($course);

$coursecontext = context_course::instance($course->id);

$event = \mod_samplinggame\event\course_module_instance_list_viewed::create(array(
    'context' => $coursecontext
));
$event->add_record_snapshot('course', $course);
$event->trigger();

$PAGE->set_url('/mod/samplinggame/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($coursecontext);

echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('modulenameplural', 'mod_samplinggame'));

$samplinggames = get_all_instances_in_course('samplinggame', $course);

if (empty($samplinggames)) {
    notice(get_string('nosamplinggames', 'mod_samplinggame'), new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head = array();
$table->align = array();

$table->head[] = get_string('name');
$table->align[] = 'left';

$table->head[] = get_string('samplingmethod', 'mod_samplinggame');
$table->align[] = 'left';

$table->head[] = get_string('populationsize', 'mod_samplinggame');
$table->align[] = 'center';

$table->head[] = get_string('samplesize', 'mod_samplinggame');
$table->align[] = 'center';

foreach ($samplinggames as $samplinggame) {
    $row = array();

    $attributes = array();
    if (!$samplinggame->visible) {
        $attributes['class'] = 'dimmed';
    }

    $row[] = html_writer::link(
        new moodle_url('/mod/samplinggame/view.php', array('id' => $samplinggame->coursemodule)),
        format_string($samplinggame->name),
        $attributes
    );

    $row[] = get_string($samplinggame->sampling_method, 'mod_samplinggame');
    $row[] = $samplinggame->population_size;
    $row[] = $samplinggame->sample_size;

    $table->data[] = $row;
}

echo html_writer::table($table);

echo $OUTPUT->footer();
