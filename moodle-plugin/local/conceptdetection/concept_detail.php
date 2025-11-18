<?php
/**
 * Concept Detail Page - Shows students struggling with a concept
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/conceptdetection/classes/analytics/concept_detector.php');

use local_conceptdetection\analytics\concept_detector;

// Require login and capability
require_login();
require_capability('local/conceptdetection:view', context_system::instance());

$conceptid = required_param('conceptid', PARAM_INT);

global $DB;
$concept = $DB->get_record('local_conceptdetection_concepts', array('id' => $conceptid), '*', MUST_EXIST);

$PAGE->set_url('/local/conceptdetection/concept_detail.php', array('conceptid' => $conceptid));
$PAGE->set_context(context_system::instance());
$PAGE->set_title($concept->name . ' - ' . get_string('concept_analysis', 'local_conceptdetection'));
$PAGE->set_heading(get_string('concept_analysis', 'local_conceptdetection'));
$PAGE->set_pagelayout('standard');

// Add CSS
$PAGE->requires->css('/local/conceptdetection/styles.css');

echo $OUTPUT->header();

// Concept header
echo html_writer::start_div('concept-detail-header');
echo html_writer::tag('h2', $concept->name);
if (!empty($concept->description)) {
    echo html_writer::tag('p', $concept->description);
}
echo html_writer::tag('p',
    get_string('difficulty', 'local_conceptdetection') . ': ' .
    render_difficulty_badge($concept->difficulty) . ' | ' .
    get_string('module_type', 'local_conceptdetection') . ': ' .
    ($concept->moduletype ?: get_string('all', 'local_conceptdetection'))
);
echo html_writer::end_div();

// Get struggling students
$struggling_students = concept_detector::get_struggling_students($conceptid);

// Statistics
$total_students = $DB->count_records('local_conceptdetection_tracking', array('conceptid' => $conceptid));
$not_understood = $DB->count_records('local_conceptdetection_tracking',
    array('conceptid' => $conceptid, 'status' => 'not_understood'));
$partially_understood = $DB->count_records('local_conceptdetection_tracking',
    array('conceptid' => $conceptid, 'status' => 'partially_understood'));
$understood = $DB->count_records('local_conceptdetection_tracking',
    array('conceptid' => $conceptid, 'status' => 'understood'));

// Summary cards
echo html_writer::start_div('summary-cards');
echo render_summary_card(get_string('total_students', 'local_conceptdetection'),
    $total_students, 'info');
echo render_summary_card(get_string('understood', 'local_conceptdetection'),
    $understood, 'success');
echo render_summary_card(get_string('partially_understood', 'local_conceptdetection'),
    $partially_understood, 'warning');
echo render_summary_card(get_string('not_understood', 'local_conceptdetection'),
    $not_understood, 'danger');
echo html_writer::end_div();

// Struggling students table
echo html_writer::tag('h3', get_string('struggling_students', 'local_conceptdetection'));

if (!empty($struggling_students)) {
    echo html_writer::start_tag('table', array('class' => 'table students-table'));
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('student_name', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('email', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('status', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('attempts', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('time_spent', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('score', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('confidence', 'local_conceptdetection'));
    echo html_writer::tag('th', get_string('last_activity', 'local_conceptdetection'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');
    echo html_writer::start_tag('tbody');

    foreach ($struggling_students as $student) {
        echo html_writer::start_tag('tr');

        // Name with link to profile
        $profile_url = new moodle_url('/user/view.php', array('id' => $student->userid));
        echo html_writer::tag('td', html_writer::link($profile_url,
            fullname($student)));

        // Email
        echo html_writer::tag('td', $student->email);

        // Status
        echo html_writer::tag('td', render_status_badge($student->status));

        // Attempts
        echo html_writer::tag('td', $student->attempts);

        // Time spent
        echo html_writer::tag('td', format_time($student->timespent));

        // Score
        $score_text = !is_null($student->maxscore) ?
            sprintf('%.1f%%', $student->maxscore) : '-';
        $score_class = '';
        if (!is_null($student->maxscore)) {
            if ($student->maxscore >= 70) {
                $score_class = 'text-success';
            } else if ($student->maxscore >= 50) {
                $score_class = 'text-warning';
            } else {
                $score_class = 'text-danger';
            }
        }
        echo html_writer::tag('td', $score_text, array('class' => $score_class));

        // Confidence
        echo html_writer::tag('td', render_confidence_meter($student->confidence));

        // Last activity
        echo html_writer::tag('td', userdate($student->timemodified,
            get_string('strftimedatetime', 'langconfig')));

        echo html_writer::end_tag('tr');
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');

    // Recommendations
    echo html_writer::start_div('recommendation-box');
    echo html_writer::tag('h4', get_string('recommendations', 'local_conceptdetection'));
    echo html_writer::start_tag('ul');
    echo html_writer::tag('li', get_string('recommendation_review_material', 'local_conceptdetection'));
    echo html_writer::tag('li', get_string('recommendation_one_on_one', 'local_conceptdetection'));
    echo html_writer::tag('li', get_string('recommendation_practice', 'local_conceptdetection'));
    echo html_writer::tag('li', get_string('recommendation_peer_learning', 'local_conceptdetection'));
    echo html_writer::end_tag('ul');
    echo html_writer::end_div();
} else {
    echo html_writer::tag('p', get_string('no_struggling_students', 'local_conceptdetection'),
        array('class' => 'alert alert-success'));
}

// Back button
$back_url = new moodle_url('/local/conceptdetection/index.php', array('courseid' => $concept->courseid));
echo html_writer::link($back_url, get_string('back_to_dashboard', 'local_conceptdetection'),
    array('class' => 'btn btn-secondary'));

echo $OUTPUT->footer();

/**
 * Helper functions
 */
function render_summary_card($title, $value, $type = 'info') {
    $class = "summary-card summary-card-$type";
    $html = html_writer::start_div($class);
    $html .= html_writer::tag('div', $title, array('class' => 'card-title'));
    $html .= html_writer::tag('div', $value, array('class' => 'card-value'));
    $html .= html_writer::end_div();
    return $html;
}

function render_difficulty_badge($difficulty) {
    $labels = array(
        1 => get_string('difficulty_very_easy', 'local_conceptdetection'),
        2 => get_string('difficulty_easy', 'local_conceptdetection'),
        3 => get_string('difficulty_medium', 'local_conceptdetection'),
        4 => get_string('difficulty_hard', 'local_conceptdetection'),
        5 => get_string('difficulty_very_hard', 'local_conceptdetection')
    );

    $colors = array(1 => 'success', 2 => 'info', 3 => 'primary', 4 => 'warning', 5 => 'danger');

    $label = isset($labels[$difficulty]) ? $labels[$difficulty] : $difficulty;
    $color = isset($colors[$difficulty]) ? $colors[$difficulty] : 'secondary';

    return html_writer::tag('span', $label, array('class' => "badge badge-$color"));
}

function render_status_badge($status) {
    $labels = array(
        'not_started' => get_string('not_started', 'local_conceptdetection'),
        'not_understood' => get_string('not_understood', 'local_conceptdetection'),
        'partially_understood' => get_string('partially_understood', 'local_conceptdetection'),
        'understood' => get_string('understood', 'local_conceptdetection')
    );

    $label = isset($labels[$status]) ? $labels[$status] : $status;
    return html_writer::tag('span', $label, array('class' => "status-badge status-$status"));
}

function render_confidence_meter($confidence) {
    $html = html_writer::start_div('confidence-meter');
    $html .= html_writer::div('', 'confidence-bar', array('style' => "width: {$confidence}%"));
    $html .= html_writer::end_div();
    $html .= ' ' . sprintf('%.0f%%', $confidence);
    return $html;
}
