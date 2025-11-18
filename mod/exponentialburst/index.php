<?php
// This file is part of Moodle - http://moodle.org/

/**
 * List all exponentialburst activities in a course
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT); // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$PAGE->set_url('/mod/exponentialburst/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context(context_course::instance($course->id));

echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('modulenameplural', 'exponentialburst'));

if (!$exponentialbursts = get_all_instances_in_course('exponentialburst', $course)) {
    notice(get_string('thereareno', 'moodle', get_string('modulenameplural', 'exponentialburst')),
        new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head = array(
    get_string('name'),
    get_string('difficulty', 'exponentialburst')
);

foreach ($exponentialbursts as $exponentialburst) {
    $link = html_writer::link(
        new moodle_url('/mod/exponentialburst/view.php', array('id' => $exponentialburst->coursemodule)),
        format_string($exponentialburst->name)
    );

    $table->data[] = array($link, $exponentialburst->difficulty);
}

echo html_writer::table($table);

echo $OUTPUT->footer();
