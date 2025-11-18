<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Flow Moments Dashboard
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');

require_login();

$courseid = optional_param('courseid', 0, PARAM_INT);
$userid = optional_param('userid', $USER->id, PARAM_INT);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url('/local/flowmoments/index.php', ['courseid' => $courseid, 'userid' => $userid]);
$PAGE->set_title(get_string('flowmoments_dashboard', 'local_flowmoments'));
$PAGE->set_heading(get_string('flowmoments_dashboard', 'local_flowmoments'));

// Check permissions
$can_view_others = has_capability('local/flowmoments:viewreports', $context);
if ($userid != $USER->id && !$can_view_others) {
    print_error('nopermissions', 'error', '', 'view other users\' flow moments');
}

echo $OUTPUT->header();

// Get user info
$user = $DB->get_record('user', ['id' => $userid], '*', MUST_EXIST);
echo $OUTPUT->heading(get_string('flowmoments_for', 'local_flowmoments', fullname($user)), 2);

// Get summary data
if ($courseid > 0) {
    $summary = $DB->get_record('local_flowmoments_summary', [
        'userid' => $userid,
        'courseid' => $courseid,
    ]);
    $course = $DB->get_record('course', ['id' => $courseid]);
    $course_filter = " AND courseid = :courseid";
    $params = ['userid' => $userid, 'courseid' => $courseid];
} else {
    $summary = $DB->get_record_sql(
        "SELECT SUM(totalflowmoments) as totalflowmoments,
                AVG(avgflowscore) as avgflowscore,
                SUM(totalflowtime) as totalflowtime,
                MAX(lastflowtime) as lastflowtime
         FROM {local_flowmoments_summary}
         WHERE userid = :userid",
        ['userid' => $userid]
    );
    $course = null;
    $course_filter = "";
    $params = ['userid' => $userid];
}

// Display summary statistics
echo html_writer::start_div('flow-summary-stats');

if ($summary) {
    echo html_writer::tag('h3', get_string('summary_statistics', 'local_flowmoments'));

    echo html_writer::start_tag('div', ['class' => 'row']);

    // Total flow moments
    echo html_writer::start_tag('div', ['class' => 'col-md-3']);
    echo html_writer::tag('div', $summary->totalflowmoments ?? 0, ['class' => 'stat-number']);
    echo html_writer::tag('div', get_string('total_flow_moments', 'local_flowmoments'), ['class' => 'stat-label']);
    echo html_writer::end_tag('div');

    // Average flow score
    echo html_writer::start_tag('div', ['class' => 'col-md-3']);
    echo html_writer::tag('div', round($summary->avgflowscore ?? 0, 1), ['class' => 'stat-number']);
    echo html_writer::tag('div', get_string('avg_flow_score', 'local_flowmoments'), ['class' => 'stat-label']);
    echo html_writer::end_tag('div');

    // Total flow time (in hours)
    echo html_writer::start_tag('div', ['class' => 'col-md-3']);
    $flow_hours = round(($summary->totalflowtime ?? 0) / 3600, 1);
    echo html_writer::tag('div', $flow_hours, ['class' => 'stat-number']);
    echo html_writer::tag('div', get_string('total_flow_hours', 'local_flowmoments'), ['class' => 'stat-label']);
    echo html_writer::end_tag('div');

    // Last flow moment
    echo html_writer::start_tag('div', ['class' => 'col-md-3']);
    if ($summary->lastflowtime) {
        $last_flow = userdate($summary->lastflowtime, get_string('strftimedatetimeshort', 'langconfig'));
    } else {
        $last_flow = get_string('never', 'local_flowmoments');
    }
    echo html_writer::tag('div', $last_flow, ['class' => 'stat-text']);
    echo html_writer::tag('div', get_string('last_flow_moment', 'local_flowmoments'), ['class' => 'stat-label']);
    echo html_writer::end_tag('div');

    echo html_writer::end_tag('div');
} else {
    echo $OUTPUT->notification(get_string('no_flow_data', 'local_flowmoments'), 'info');
}

echo html_writer::end_div();

// Display detailed flow moments table
echo html_writer::tag('h3', get_string('flow_moments_history', 'local_flowmoments'), ['class' => 'mt-4']);

$table = new flexible_table('local_flowmoments_history');
$table->define_baseurl($PAGE->url);

$table->define_columns(['starttime', 'course', 'duration', 'flowscore', 'indicators']);
$table->define_headers([
    get_string('start_time', 'local_flowmoments'),
    get_string('course'),
    get_string('duration', 'local_flowmoments'),
    get_string('flow_score', 'local_flowmoments'),
    get_string('indicators', 'local_flowmoments'),
]);

$table->set_attribute('class', 'generaltable');
$table->setup();

// Get flow moments
$sql = "SELECT fm.*, c.fullname as coursename
        FROM {local_flowmoments_detected} fm
        JOIN {course} c ON c.id = fm.courseid
        WHERE fm.userid = :userid $course_filter
        ORDER BY fm.starttime DESC
        LIMIT 50";

$flow_moments = $DB->get_records_sql($sql, $params);

foreach ($flow_moments as $moment) {
    $start_time = userdate($moment->starttime, get_string('strftimedatetime', 'langconfig'));
    $duration = format_time($moment->duration);
    $flow_score = round($moment->flowscore, 1);

    // Parse indicators
    $indicators_data = json_decode($moment->indicators, true);
    $indicators_html = '<ul class="flow-indicators">';
    foreach ($indicators_data as $key => $value) {
        $indicator_name = get_string('indicator_' . $key, 'local_flowmoments');
        $indicators_html .= '<li>' . $indicator_name . ': ' . round($value, 1) . '</li>';
    }
    $indicators_html .= '</ul>';

    // Color code flow score
    $score_class = '';
    if ($flow_score >= 85) {
        $score_class = 'badge-success';
    } else if ($flow_score >= 70) {
        $score_class = 'badge-primary';
    } else {
        $score_class = 'badge-warning';
    }
    $score_html = html_writer::tag('span', $flow_score, ['class' => 'badge ' . $score_class]);

    $table->add_data([
        $start_time,
        $moment->coursename,
        $duration,
        $score_html,
        $indicators_html,
    ]);
}

$table->finish_output();

// Add CSS
echo html_writer::tag('style', '
.flow-summary-stats { margin: 20px 0; }
.stat-number { font-size: 36px; font-weight: bold; color: #0066cc; }
.stat-text { font-size: 18px; color: #333; }
.stat-label { font-size: 14px; color: #666; margin-top: 5px; }
.flow-indicators { list-style: none; padding: 0; margin: 0; font-size: 12px; }
.flow-indicators li { padding: 2px 0; }
.badge { padding: 5px 10px; border-radius: 3px; color: white; }
.badge-success { background-color: #28a745; }
.badge-primary { background-color: #007bff; }
.badge-warning { background-color: #ffc107; color: #333; }
');

echo $OUTPUT->footer();
