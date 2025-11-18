<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Engagement report page for teachers
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');

$courseid = required_param('courseid', PARAM_INT);
$download = optional_param('download', '', PARAM_ALPHA);

$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_capability('local/engagementalert:viewreports', $context);

$PAGE->set_url('/local/engagementalert/report.php', ['courseid' => $courseid]);
$PAGE->set_context($context);
$PAGE->set_title(get_string('report_title', 'local_engagementalert'));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('incourse');

// Initialize table
$table = new flexible_table('local-engagementalert-report');
$table->define_baseurl($PAGE->url);

$columns = ['fullname', 'email', 'total_sessions', 'total_alerts', 'avg_engagement', 'last_activity'];
$headers = [
    get_string('fullname'),
    get_string('email'),
    get_string('total_sessions', 'local_engagementalert'),
    get_string('total_alerts', 'local_engagementalert'),
    get_string('engagement_score', 'local_engagementalert'),
    get_string('last_activity', 'local_engagementalert'),
];

$table->define_columns($columns);
$table->define_headers($headers);
$table->sortable(true, 'last_activity', SORT_DESC);
$table->collapsible(false);
$table->is_downloadable(true);
$table->show_download_buttons_at([TABLE_P_BOTTOM]);

$table->setup();

if (!$table->is_downloading()) {
    echo $OUTPUT->header();
    echo $OUTPUT->heading(get_string('report_title', 'local_engagementalert'));

    // Show summary statistics
    $tracker = new \local_engagementalert\engagement_tracker();
    $stats = $tracker->get_course_statistics($courseid);

    echo '<div class="alert alert-info">';
    echo '<h4>Course Summary (Last 7 Days)</h4>';
    echo '<ul>';
    echo '<li>Total Sessions: ' . $stats['total_sessions'] . '</li>';
    echo '<li>Total Alerts: ' . $stats['total_alerts'] . '</li>';
    echo '<li>Average Engagement Score: ' . $stats['avg_engagement_score'] . '%</li>';
    echo '<li>Most Common Alert: ' . $stats['most_common_alert'] . '</li>';
    echo '</ul>';
    echo '</div>';
}

// Get enrolled students
$enrolledusers = get_enrolled_users($context, 'local/engagementalert:view');

foreach ($enrolledusers as $user) {
    // Get user's engagement data
    $sql = "SELECT
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(DISTINCT a.id) as total_alerts,
                AVG(s.engagement_score) as avg_engagement,
                MAX(s.ended_at) as last_activity
            FROM {user} u
            LEFT JOIN {local_engagement_sessions} s ON s.userid = u.id AND s.courseid = :courseid1
            LEFT JOIN {local_engagement_alerts} a ON a.userid = u.id AND a.courseid = :courseid2
            WHERE u.id = :userid";

    $data = $DB->get_record_sql($sql, [
        'courseid1' => $courseid,
        'courseid2' => $courseid,
        'userid' => $user->id
    ]);

    $row = [
        fullname($user),
        $user->email,
        $data->total_sessions ?: 0,
        $data->total_alerts ?: 0,
        $data->avg_engagement ? round($data->avg_engagement, 1) . '%' : 'N/A',
        $data->last_activity ? userdate($data->last_activity) : 'Never'
    ];

    $table->add_data($row);
}

$table->finish_output();

if (!$table->is_downloading()) {
    echo $OUTPUT->footer();
}
