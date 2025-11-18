<?php
/**
 * Detailed view page for Thinking Routine Consistency scores
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->libdir . '/tablelib.php');

$courseid = required_param('courseid', PARAM_INT);
$userid = optional_param('userid', $USER->id, PARAM_INT);

require_login($courseid);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

// Check permissions
if ($userid != $USER->id) {
    require_capability('block/thinkroutine_consistency:viewall', $context);
}

$PAGE->set_url('/blocks/thinkroutine_consistency/view.php', array('courseid' => $courseid, 'userid' => $userid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('pluginname', 'block_thinkroutine_consistency'));
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();

// Get user info
$user = $DB->get_record('user', array('id' => $userid), '*', MUST_EXIST);

echo $OUTPUT->heading(get_string('pluginname', 'block_thinkroutine_consistency') . ' - ' . fullname($user));

// Period selector
$periodend = time();
$periodstart = $periodend - (30 * 24 * 60 * 60); // Last 30 days

// Get overall score
$overall_score = \block_thinkroutine_consistency\consistency_calculator::get_overall_score(
    $userid,
    $courseid,
    $periodstart,
    $periodend
);

// Display overall score
echo html_writer::start_div('alert alert-info');
echo html_writer::tag('h3', get_string('overallscore', 'block_thinkroutine_consistency') . ': ' . round($overall_score) . '/100');
echo html_writer::end_div();

// Get pattern scores
$sql = "SELECT s.*, p.name, p.category, p.description
        FROM {block_trc_scores} s
        JOIN {block_trc_patterns} p ON s.patternid = p.id
        WHERE s.userid = :userid
        AND s.courseid = :courseid
        AND s.period_start = :periodstart
        AND s.period_end = :periodend
        ORDER BY s.score DESC";

$scores = $DB->get_records_sql($sql, [
    'userid' => $userid,
    'courseid' => $courseid,
    'periodstart' => $periodstart,
    'periodend' => $periodend
]);

if (!empty($scores)) {
    // Create table
    $table = new html_table();
    $table->head = array(
        get_string('pattern_name', 'block_thinkroutine_consistency'),
        get_string('category', 'block_thinkroutine_consistency'),
        get_string('score', 'block_thinkroutine_consistency'),
        get_string('frequency', 'block_thinkroutine_consistency'),
        get_string('adherence', 'block_thinkroutine_consistency'),
        get_string('consistency', 'block_thinkroutine_consistency')
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($scores as $score) {
        $row = array();
        $row[] = html_writer::tag('strong', $score->name) . '<br><small>' . $score->description . '</small>';
        $row[] = $score->category;
        $row[] = round($score->score) . '/100';
        $row[] = $score->frequency;
        $row[] = round($score->adherence_rate) . '%';
        $row[] = round($score->consistency_index) . '%';
        $table->data[] = $row;
    }

    echo html_writer::table($table);
} else {
    echo html_writer::div(
        get_string('noscoresyet', 'block_thinkroutine_consistency'),
        'alert alert-warning'
    );
}

// Get recent activities
echo html_writer::tag('h3', 'Recent Activities');

$activities = \block_thinkroutine_consistency\activity_tracker::get_recent_activities($userid, $courseid, 20);

if (!empty($activities)) {
    $table = new html_table();
    $table->head = array(
        'Time',
        'Activity Type',
        'Action',
        'Thinking Pattern'
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($activities as $activity) {
        $row = array();
        $row[] = userdate($activity->timecreated, '%Y-%m-%d %H:%M');
        $row[] = $activity->activitytype;
        $row[] = $activity->action;
        $row[] = $activity->pattern_name ? $activity->pattern_name . ' (' . $activity->pattern_category . ')' : '-';
        $table->data[] = $row;
    }

    echo html_writer::table($table);
}

echo $OUTPUT->footer();
