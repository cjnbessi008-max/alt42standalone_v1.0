<?php
/**
 * Teacher dashboard for viewing reasoning clips
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->libdir.'/tablelib.php');

use local_reasoningclip\reasoning_detector;

// Get parameters
$courseid = required_param('courseid', PARAM_INT);
$cmid = optional_param('cmid', 0, PARAM_INT);
$userid = optional_param('userid', 0, PARAM_INT);
$cliptype = optional_param('cliptype', '', PARAM_TEXT);

// Security checks
require_login($courseid);
$context = context_course::instance($courseid);
require_capability('local/reasoningclip:viewall', $context);

// Page setup
$PAGE->set_url('/local/reasoningclip/dashboard.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('dashboard', 'local_reasoningclip'));
$PAGE->set_heading(get_string('dashboard', 'local_reasoningclip'));

// Include JavaScript
$PAGE->requires->js_call_amd('local_reasoningclip/dashboard', 'init');

echo $OUTPUT->header();

// Dashboard header
echo html_writer::tag('h2', get_string('reasoningclips_dashboard', 'local_reasoningclip'));

// Filters
echo html_writer::start_div('reasoning-filters card mb-3');
echo html_writer::start_div('card-body');
echo html_writer::tag('h4', get_string('filters', 'local_reasoningclip'));

$filterform = html_writer::start_tag('form', array('method' => 'get', 'action' => 'dashboard.php', 'class' => 'form-inline'));
$filterform .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'courseid', 'value' => $courseid));

// Activity filter
if ($cmid > 0) {
    $cm = get_coursemodule_from_id('', $cmid, 0, false, MUST_EXIST);
    $filterform .= html_writer::tag('label', get_string('activity', 'local_reasoningclip') . ': ', array('class' => 'mr-2'));
    $filterform .= html_writer::tag('span', $cm->name, array('class' => 'badge badge-info mr-3'));
}

// Student filter
if ($userid > 0) {
    $user = $DB->get_record('user', array('id' => $userid), '*', MUST_EXIST);
    $filterform .= html_writer::tag('label', get_string('student', 'local_reasoningclip') . ': ', array('class' => 'mr-2'));
    $filterform .= html_writer::tag('span', fullname($user), array('class' => 'badge badge-primary mr-3'));
}

// Clip type filter
$cliptypes = array(
    '' => get_string('all_types', 'local_reasoningclip'),
    'breakthrough' => get_string('cliptype_breakthrough', 'local_reasoningclip'),
    'struggle' => get_string('cliptype_struggle', 'local_reasoningclip'),
    'rapid_solve' => get_string('cliptype_rapid_solve', 'local_reasoningclip'),
    'pause_think' => get_string('cliptype_pause_think', 'local_reasoningclip'),
    'systematic' => get_string('cliptype_systematic', 'local_reasoningclip'),
    'trial_error' => get_string('cliptype_trial_error', 'local_reasoningclip'),
);

$filterform .= html_writer::tag('label', get_string('cliptype', 'local_reasoningclip') . ': ', array('class' => 'mr-2'));
$filterform .= html_writer::select($cliptypes, 'cliptype', $cliptype, false, array('class' => 'custom-select mr-2'));
$filterform .= html_writer::empty_tag('input', array('type' => 'submit', 'value' => get_string('filter', 'local_reasoningclip'), 'class' => 'btn btn-primary'));

$filterform .= html_writer::end_tag('form');
echo $filterform;

echo html_writer::end_div();
echo html_writer::end_div();

// Statistics summary
$sql_conditions = array('courseid' => $courseid);
if ($cmid) {
    $sql_conditions['cmid'] = $cmid;
}
if ($userid) {
    $sql_conditions['userid'] = $userid;
}
if ($cliptype) {
    $sql_conditions['cliptype'] = $cliptype;
}

$total_clips = $DB->count_records('local_reasoningclip', $sql_conditions);

// Clip type distribution
$type_distribution = $DB->get_records_sql(
    "SELECT cliptype, COUNT(*) as count
     FROM {local_reasoningclip}
     WHERE courseid = :courseid " .
     ($cmid ? "AND cmid = :cmid " : "") .
     ($userid ? "AND userid = :userid " : "") .
     "GROUP BY cliptype",
    array_filter(array('courseid' => $courseid, 'cmid' => $cmid, 'userid' => $userid))
);

echo html_writer::start_div('reasoning-stats card mb-3');
echo html_writer::start_div('card-body');
echo html_writer::tag('h4', get_string('statistics', 'local_reasoningclip'));

echo html_writer::tag('p', get_string('total_clips', 'local_reasoningclip', $total_clips));

echo html_writer::start_tag('div', array('class' => 'clip-type-distribution'));
foreach ($type_distribution as $type => $data) {
    $type_label = isset($cliptypes[$type]) ? $cliptypes[$type] : $type;
    echo html_writer::tag('span', "$type_label: {$data->count}", array('class' => 'badge badge-secondary mr-2'));
}
echo html_writer::end_tag('div');

echo html_writer::end_div();
echo html_writer::end_div();

// Clips table
$table = new flexible_table('reasoning-clips-table');
$table->define_columns(array('student', 'activity', 'question', 'cliptype', 'confidence', 'timespent', 'timecreated', 'actions'));
$table->define_headers(array(
    get_string('student', 'local_reasoningclip'),
    get_string('activity', 'local_reasoningclip'),
    get_string('question', 'local_reasoningclip'),
    get_string('cliptype', 'local_reasoningclip'),
    get_string('confidence', 'local_reasoningclip'),
    get_string('timespent', 'local_reasoningclip'),
    get_string('timecreated', 'local_reasoningclip'),
    get_string('actions', 'local_reasoningclip')
));

$table->define_baseurl($PAGE->url);
$table->sortable(true, 'timecreated', SORT_DESC);
$table->set_attribute('class', 'table table-striped table-hover');
$table->setup();

// Get clips
$clips = $DB->get_records('local_reasoningclip', $sql_conditions, 'timecreated DESC', '*', 0, 100);

foreach ($clips as $clip) {
    $user = $DB->get_record('user', array('id' => $clip->userid));
    $cm = get_coursemodule_from_id('', $clip->cmid);

    $student_link = html_writer::link(
        new moodle_url('/user/view.php', array('id' => $clip->userid, 'course' => $courseid)),
        fullname($user)
    );

    $activity_link = $cm ? html_writer::link(
        new moodle_url('/mod/' . $cm->modname . '/view.php', array('id' => $cm->id)),
        $cm->name
    ) : '-';

    $cliptype_badge = html_writer::tag('span', $cliptypes[$clip->cliptype], array('class' => 'badge badge-info'));

    $confidence_color = $clip->confidence >= 0.8 ? 'success' : ($clip->confidence >= 0.6 ? 'warning' : 'secondary');
    $confidence_badge = html_writer::tag('span', number_format($clip->confidence * 100, 0) . '%',
        array('class' => "badge badge-$confidence_color"));

    $timespent_display = format_time($clip->timespent);
    $timecreated_display = userdate($clip->timecreated, get_string('strftimedatetime', 'langconfig'));

    $view_action = html_writer::link(
        new moodle_url('/local/reasoningclip/view_clip.php', array('id' => $clip->id)),
        get_string('view', 'local_reasoningclip'),
        array('class' => 'btn btn-sm btn-primary')
    );

    $table->add_data(array(
        $student_link,
        $activity_link,
        "Q{$clip->questionid}",
        $cliptype_badge,
        $confidence_badge,
        $timespent_display,
        $timecreated_display,
        $view_action
    ));
}

$table->finish_output();

echo $OUTPUT->footer();
