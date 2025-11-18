<?php
/**
 * This page lists all the instances of blossomsequence in a particular course
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT);   // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$coursecontext = context_course::instance($course->id);

$event = \mod_blossomsequence\event\course_module_instance_list_viewed::create(array(
    'context' => $coursecontext
));
$event->add_record_snapshot('course', $course);
$event->trigger();

// Print the header
$PAGE->set_url('/mod/blossomsequence/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($coursecontext);

echo $OUTPUT->header();

// Get all the appropriate data
if (! $blossomsequences = get_all_instances_in_course('blossomsequence', $course)) {
    notice(get_string('noblossomsequences', 'blossomsequence'), new moodle_url('/course/view.php', array('id' => $course->id)));
}

// Print the list of instances
$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

$table->head  = array(
    get_string('name'),
    get_string('sequencetype', 'blossomsequence'),
    get_string('difficulty', 'blossomsequence'),
    get_string('petalcount', 'blossomsequence')
);
$table->align = array('left', 'left', 'center', 'center');

foreach ($blossomsequences as $blossomsequence) {
    $link = html_writer::link(
        new moodle_url('/mod/blossomsequence/view.php', array('id' => $blossomsequence->coursemodule)),
        format_string($blossomsequence->name)
    );

    $sequencetype = get_string($blossomsequence->sequencetype, 'blossomsequence');
    $difficulty = $blossomsequence->difficulty . '/5';
    $petalcount = $blossomsequence->petalcount;

    $table->data[] = array($link, $sequencetype, $difficulty, $petalcount);
}

echo html_writer::table($table);

echo $OUTPUT->footer();
