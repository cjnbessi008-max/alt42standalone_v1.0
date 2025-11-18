<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Priority selection analytics report.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');

$courseid = required_param('courseid', PARAM_INT);

require_login($courseid);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_capability('block/student_priority:viewreports', $context);

$PAGE->set_url('/blocks/student_priority/report.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_title(get_string('report_title', 'block_student_priority'));
$PAGE->set_heading(get_string('report_title', 'block_student_priority'));
$PAGE->navbar->add(get_string('report_title', 'block_student_priority'));

echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('report_title', 'block_student_priority'));

// Get all priority selections for this course
$sql = "SELECT priority_step, step_name, COUNT(*) as count
        FROM {block_student_priority}
        WHERE courseid = :courseid
        GROUP BY priority_step, step_name
        ORDER BY count DESC, priority_step ASC";

$selections = $DB->get_records_sql($sql, array('courseid' => $courseid));

if (empty($selections)) {
    echo $OUTPUT->notification(get_string('report_no_data', 'block_student_priority'), 'info');
} else {
    // Calculate total students
    $total_students = array_sum(array_column($selections, 'count'));

    // Create table
    $table = new html_table();
    $table->head = array(
        get_string('report_step_column', 'block_student_priority'),
        get_string('report_count_column', 'block_student_priority'),
        get_string('report_percentage_column', 'block_student_priority')
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($selections as $selection) {
        $percentage = round(($selection->count / $total_students) * 100, 1);
        $row = array(
            $selection->step_name,
            $selection->count,
            $percentage . '%'
        );
        $table->data[] = $row;
    }

    echo html_writer::table($table);

    // Summary
    echo html_writer::tag('p', get_string('total_students', 'block_student_priority') . ': ' . $total_students,
                         array('class' => 'text-muted'));
}

// Show recent changes
echo $OUTPUT->heading(get_string('recent_changes', 'block_student_priority'), 3);

$sql = "SELECT l.*, u.firstname, u.lastname
        FROM {block_student_priority_log} l
        JOIN {user} u ON u.id = l.userid
        WHERE l.courseid = :courseid
        ORDER BY l.timecreated DESC
        LIMIT 20";

$logs = $DB->get_records_sql($sql, array('courseid' => $courseid));

if (empty($logs)) {
    echo $OUTPUT->notification(get_string('no_changes', 'block_student_priority'), 'info');
} else {
    $table = new html_table();
    $table->head = array(
        get_string('student', 'block_student_priority'),
        get_string('old_priority', 'block_student_priority'),
        get_string('new_priority', 'block_student_priority'),
        get_string('when', 'block_student_priority')
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($logs as $log) {
        $student_name = fullname($log);
        $old_step = $log->old_priority_step ? $log->old_priority_step : '-';
        $new_step = $log->new_priority_step;
        $when = userdate($log->timecreated);

        $table->data[] = array($student_name, $old_step, $new_step, $when);
    }

    echo html_writer::table($table);
}

echo $OUTPUT->footer();
