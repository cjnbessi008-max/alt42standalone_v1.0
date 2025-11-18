<?php
/**
 * Concept Detection Dashboard - Main Page
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/conceptdetection/classes/analytics/concept_detector.php');
require_once($CFG->dirroot . '/local/conceptdetection/classes/analytics/behavior_analyzer.php');

use local_conceptdetection\analytics\concept_detector;
use local_conceptdetection\analytics\behavior_analyzer;

// Require login and capability
require_login();
require_capability('local/conceptdetection:view', context_system::instance());

$courseid = optional_param('courseid', 0, PARAM_INT);
$action = optional_param('action', 'dashboard', PARAM_ALPHA);

$PAGE->set_url('/local/conceptdetection/index.php', array('courseid' => $courseid));
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('dashboard', 'local_conceptdetection'));
$PAGE->set_heading(get_string('dashboard', 'local_conceptdetection'));
$PAGE->set_pagelayout('standard');

// Add CSS
$PAGE->requires->css('/local/conceptdetection/styles.css');

echo $OUTPUT->header();

// Course selector
echo html_writer::start_div('concept-detection-wrapper');
echo html_writer::tag('h2', get_string('dashboard', 'local_conceptdetection'));

// Get user's courses (as teacher)
$courses = enrol_get_users_courses($USER->id, true);
$teacher_courses = array();

foreach ($courses as $course) {
    $context = context_course::instance($course->id);
    if (has_capability('local/conceptdetection:viewreports', $context)) {
        $teacher_courses[$course->id] = $course;
    }
}

if (empty($teacher_courses)) {
    echo html_writer::tag('p', get_string('no_courses_found', 'local_conceptdetection'),
        array('class' => 'alert alert-warning'));
    echo $OUTPUT->footer();
    exit;
}

// Course selector dropdown
echo html_writer::start_div('course-selector');
echo html_writer::tag('label', get_string('select_course', 'local_conceptdetection') . ': ',
    array('for' => 'courseid-select'));

$select = new single_select(
    new moodle_url('/local/conceptdetection/index.php'),
    'courseid',
    array_combine(array_keys($teacher_courses), array_map(function($c) {
        return $c->fullname;
    }, $teacher_courses)),
    $courseid,
    array('' => get_string('choosedots'))
);
echo $OUTPUT->render($select);
echo html_writer::end_div();

if ($courseid) {
    // Auto-detect concepts if not already done
    $concepts = concept_detector::get_course_concepts($courseid);
    if (empty($concepts)) {
        echo html_writer::start_div('alert alert-info');
        echo html_writer::tag('p', get_string('auto_detecting_concepts', 'local_conceptdetection'));
        echo html_writer::end_div();

        $concepts = concept_detector::auto_detect_concepts($courseid);

        if (!empty($concepts)) {
            echo html_writer::start_div('alert alert-success');
            echo html_writer::tag('p', get_string('concepts_detected', 'local_conceptdetection',
                count($concepts)));
            echo html_writer::end_div();
        }
    }

    // Actions
    echo html_writer::start_div('actions-bar');
    $analyze_url = new moodle_url('/local/conceptdetection/index.php',
        array('courseid' => $courseid, 'action' => 'analyze'));
    echo html_writer::link($analyze_url, get_string('analyze_now', 'local_conceptdetection'),
        array('class' => 'btn btn-primary'));
    echo html_writer::end_div();

    // Perform analysis if requested
    if ($action === 'analyze') {
        echo html_writer::start_div('alert alert-info');
        echo html_writer::tag('p', get_string('analyzing', 'local_conceptdetection'));
        echo html_writer::end_div();

        $analyzer = new behavior_analyzer();
        $results = $analyzer->analyze_course($courseid);

        // Store results
        echo html_writer::start_div('alert alert-success');
        echo html_writer::tag('p', get_string('analysis_complete', 'local_conceptdetection',
            count($results)));
        echo html_writer::end_div();
    }

    // Display course report
    $report = concept_detector::generate_course_report($courseid);

    echo html_writer::start_div('course-report');

    // Summary statistics
    echo html_writer::tag('h3', get_string('summary', 'local_conceptdetection'));
    echo html_writer::start_div('summary-cards');

    $total_concepts = count($report['concepts']);
    $total_students = 0;
    $total_not_understood = 0;
    $total_partially_understood = 0;

    foreach ($report['concepts'] as $concept_data) {
        $stats = $concept_data['stats'];
        $total_students = max($total_students, $concept_data['total_students']);
        $total_not_understood += $stats['not_understood'];
        $total_partially_understood += $stats['partially_understood'];
    }

    echo render_summary_card(get_string('total_concepts', 'local_conceptdetection'),
        $total_concepts, 'info');
    echo render_summary_card(get_string('total_students', 'local_conceptdetection'),
        $total_students, 'info');
    echo render_summary_card(get_string('students_struggling', 'local_conceptdetection'),
        $total_not_understood, 'danger');
    echo render_summary_card(get_string('students_partial', 'local_conceptdetection'),
        $total_partially_understood, 'warning');

    echo html_writer::end_div(); // summary-cards

    // Concepts table
    echo html_writer::tag('h3', get_string('concepts_detail', 'local_conceptdetection'));

    if (!empty($report['concepts'])) {
        echo html_writer::start_tag('table', array('class' => 'table concepts-table'));
        echo html_writer::start_tag('thead');
        echo html_writer::start_tag('tr');
        echo html_writer::tag('th', get_string('concept_name', 'local_conceptdetection'));
        echo html_writer::tag('th', get_string('difficulty', 'local_conceptdetection'));
        echo html_writer::tag('th', get_string('understood', 'local_conceptdetection'));
        echo html_writer::tag('th', get_string('partially_understood', 'local_conceptdetection'));
        echo html_writer::tag('th', get_string('not_understood', 'local_conceptdetection'));
        echo html_writer::tag('th', get_string('actions', 'local_conceptdetection'));
        echo html_writer::end_tag('tr');
        echo html_writer::end_tag('thead');
        echo html_writer::start_tag('tbody');

        foreach ($report['concepts'] as $concept_id => $concept_data) {
            $concept = $concept_data['concept'];
            $stats = $concept_data['stats'];

            echo html_writer::start_tag('tr');
            echo html_writer::tag('td', $concept->name);
            echo html_writer::tag('td', render_difficulty_badge($concept->difficulty));
            echo html_writer::tag('td', $stats['understood'],
                array('class' => 'text-success'));
            echo html_writer::tag('td', $stats['partially_understood'],
                array('class' => 'text-warning'));
            echo html_writer::tag('td', $stats['not_understood'],
                array('class' => 'text-danger'));

            $detail_url = new moodle_url('/local/conceptdetection/concept_detail.php',
                array('conceptid' => $concept_id));
            echo html_writer::tag('td',
                html_writer::link($detail_url, get_string('view_details', 'local_conceptdetection'),
                    array('class' => 'btn btn-sm btn-secondary')));
            echo html_writer::end_tag('tr');
        }

        echo html_writer::end_tag('tbody');
        echo html_writer::end_tag('table');
    } else {
        echo html_writer::tag('p', get_string('no_concepts_found', 'local_conceptdetection'),
            array('class' => 'alert alert-warning'));
    }

    echo html_writer::end_div(); // course-report
}

echo html_writer::end_div(); // concept-detection-wrapper

echo $OUTPUT->footer();

/**
 * Render a summary card
 */
function render_summary_card($title, $value, $type = 'info') {
    $class = "summary-card summary-card-$type";
    $html = html_writer::start_div($class);
    $html .= html_writer::tag('div', $title, array('class' => 'card-title'));
    $html .= html_writer::tag('div', $value, array('class' => 'card-value'));
    $html .= html_writer::end_div();
    return $html;
}

/**
 * Render difficulty badge
 */
function render_difficulty_badge($difficulty) {
    $labels = array(
        1 => get_string('difficulty_1', 'local_conceptdetection'),
        2 => get_string('difficulty_2', 'local_conceptdetection'),
        3 => get_string('difficulty_3', 'local_conceptdetection'),
        4 => get_string('difficulty_4', 'local_conceptdetection'),
        5 => get_string('difficulty_5', 'local_conceptdetection')
    );

    $colors = array(1 => 'success', 2 => 'info', 3 => 'primary', 4 => 'warning', 5 => 'danger');

    $label = isset($labels[$difficulty]) ? $labels[$difficulty] : $difficulty;
    $color = isset($colors[$difficulty]) ? $colors[$difficulty] : 'secondary';

    return html_writer::tag('span', $label, array('class' => "badge badge-$color"));
}
