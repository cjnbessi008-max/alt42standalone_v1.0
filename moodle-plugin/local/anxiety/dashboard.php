<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Anxiety Detection Dashboard
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');

// Get parameters
$courseid = required_param('courseid', PARAM_INT);
$userid = optional_param('userid', null, PARAM_INT);
$timerange = optional_param('timerange', 'week', PARAM_ALPHA);

// Require login
require_login($courseid);

$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
$context = context_course::instance($courseid);

// Check permissions
require_capability('local/anxiety:view', $context);

$can_view_others = has_capability('local/anxiety:viewothers', $context);

// If viewing specific user, check permissions
if ($userid !== null && $userid != $USER->id && !$can_view_others) {
    print_error('nopermissions', 'error', '', 'view other users');
}

// Set up page
$PAGE->set_url('/local/anxiety/dashboard.php', ['courseid' => $courseid]);
$PAGE->set_context($context);
$PAGE->set_title(get_string('dashboard', 'local_anxiety'));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('incourse');

// Add JavaScript
$PAGE->requires->js_call_amd('local_anxiety/dashboard', 'init', [
    $USER->id,
    $courseid,
    $userid,
    $timerange,
    sesskey()
]);

// Output
echo $OUTPUT->header();

echo html_writer::tag('h2', get_string('anxiety_dashboard', 'local_anxiety'));

// Time range selector
$timerange_options = [
    'today' => get_string('today', 'local_anxiety'),
    'week' => get_string('this_week', 'local_anxiety'),
    'month' => get_string('this_month', 'local_anxiety'),
];

echo html_writer::start_div('anxiety-controls');
echo html_writer::label(get_string('timerange', 'local_anxiety'), 'timerange-select');
echo html_writer::select($timerange_options, 'timerange', $timerange, false, [
    'id' => 'timerange-select',
    'class' => 'custom-select'
]);
echo html_writer::end_div();

// Dashboard content
if ($can_view_others && $userid === null) {
    // Teacher view - show all students
    echo html_writer::start_div('anxiety-dashboard-teacher', ['id' => 'anxiety-dashboard']);

    // Alert summary
    echo html_writer::start_div('anxiety-alerts-summary card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('recent_alerts', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::div('', 'anxiety-loading', ['id' => 'alerts-loading']);
    echo html_writer::div('', '', ['id' => 'alerts-container']);
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    // Students overview
    echo html_writer::start_div('anxiety-students-overview card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('students_overview', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::div('', 'anxiety-loading', ['id' => 'students-loading']);
    echo html_writer::div('', '', ['id' => 'students-container']);
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    // Chart
    echo html_writer::start_div('anxiety-chart-container card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('anxiety_distribution', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::tag('canvas', '', ['id' => 'anxiety-chart', 'width' => '400', 'height' => '200']);
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    echo html_writer::end_div(); // dashboard

} else {
    // Student view - show own data
    $target_userid = $userid ?? $USER->id;
    $user = $DB->get_record('user', ['id' => $target_userid], 'id, firstname, lastname');

    echo html_writer::start_div('anxiety-dashboard-student', ['id' => 'anxiety-dashboard']);

    echo html_writer::tag('h3', get_string('anxiety_report_for', 'local_anxiety', fullname($user)));

    // Current status
    echo html_writer::start_div('anxiety-current-status card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('current_status', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::div('', 'anxiety-loading', ['id' => 'status-loading']);
    echo html_writer::div('', '', ['id' => 'status-container']);
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    // Trend chart
    echo html_writer::start_div('anxiety-trend-container card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('anxiety_trend', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::tag('canvas', '', ['id' => 'anxiety-trend-chart', 'width' => '400', 'height' => '200']);
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    // Tips for managing anxiety
    echo html_writer::start_div('anxiety-tips card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h4', get_string('anxiety_tips_title', 'local_anxiety'), ['class' => 'card-title']);
    echo html_writer::start_tag('ul');
    echo html_writer::tag('li', get_string('anxiety_tip_1', 'local_anxiety'));
    echo html_writer::tag('li', get_string('anxiety_tip_2', 'local_anxiety'));
    echo html_writer::tag('li', get_string('anxiety_tip_3', 'local_anxiety'));
    echo html_writer::tag('li', get_string('anxiety_tip_4', 'local_anxiety'));
    echo html_writer::tag('li', get_string('anxiety_tip_5', 'local_anxiety'));
    echo html_writer::end_tag('ul');
    echo html_writer::end_div(); // card-body
    echo html_writer::end_div(); // card

    echo html_writer::end_div(); // dashboard
}

// Include Chart.js from CDN (Moodle 3.7 compatible)
echo html_writer::script('', 'https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js');

// CSS
echo html_writer::start_tag('style');
?>
.anxiety-loading {
    text-align: center;
    padding: 20px;
}
.anxiety-loading:after {
    content: 'Loading...';
    color: #999;
}
.anxiety-level-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 0.9em;
}
.anxiety-level-normal { background-color: #28a745; color: white; }
.anxiety-level-mild { background-color: #ffc107; color: #333; }
.anxiety-level-moderate { background-color: #ff9800; color: white; }
.anxiety-level-severe { background-color: #dc3545; color: white; }

.anxiety-controls {
    margin: 20px 0;
}
.anxiety-controls select {
    margin-left: 10px;
}

.anxiety-student-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.anxiety-student-card:hover {
    background-color: #f8f9fa;
}

.anxiety-alert-item {
    border-left: 4px solid #dc3545;
    padding: 10px 15px;
    margin: 10px 0;
    background-color: #fff3cd;
    border-radius: 4px;
}
.anxiety-alert-item.acknowledged {
    opacity: 0.6;
    border-left-color: #6c757d;
    background-color: #e9ecef;
}

table.anxiety-table {
    width: 100%;
    margin: 20px 0;
}
table.anxiety-table th {
    background-color: #f8f9fa;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
}
table.anxiety-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #dee2e6;
}
<?php
echo html_writer::end_tag('style');

echo $OUTPUT->footer();
