<?php
/**
 * Grade a specific submission
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Course module ID
$id = required_param('id', PARAM_INT);
$submissionid = required_param('submissionid', PARAM_INT);

$cm = get_coursemodule_from_id('problemexplain', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$problemexplain = $DB->get_record('problemexplain', array('id' => $cm->instance), '*', MUST_EXIST);
$submission = $DB->get_record('problemexplain_submissions', array('id' => $submissionid), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/problemexplain:grade', $context);

$PAGE->set_url('/mod/problemexplain/grade.php', array('id' => $cm->id, 'submissionid' => $submissionid));
$PAGE->set_title(format_string($problemexplain->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get student info
$student = $DB->get_record('user', array('id' => $submission->userid));

// Get steps
$steps = $DB->get_records('problemexplain_steps',
    array('submission_id' => $submission->id),
    'step_number ASC'
);

// Get AI evaluation
$ai_eval = $DB->get_record('problemexplain_ai_eval', array('submission_id' => $submission->id));

// Get existing grade
$existing_grade = $DB->get_record('problemexplain_grades', array('submission_id' => $submission->id));

// Handle form submission
if ($formdata = data_submitted() && confirm_sesskey()) {
    $grade = required_param('grade', PARAM_FLOAT);
    $feedback = optional_param('feedback', '', PARAM_RAW);

    $grade_record = new stdClass();
    $grade_record->submission_id = $submission->id;
    $grade_record->grade = $grade;
    $grade_record->feedback = $feedback;
    $grade_record->grader_id = $USER->id;
    $grade_record->timemodified = time();

    if ($existing_grade) {
        $grade_record->id = $existing_grade->id;
        $DB->update_record('problemexplain_grades', $grade_record);
    } else {
        $grade_record->timecreated = time();
        $DB->insert_record('problemexplain_grades', $grade_record);
    }

    // Update submission status
    $submission->status = 'graded';
    $DB->update_record('problemexplain_submissions', $submission);

    // Update gradebook
    problemexplain_update_grades($problemexplain, $submission->userid);

    redirect(new moodle_url('/mod/problemexplain/submissions.php', array('id' => $cm->id)),
        get_string('grade_saved', 'problemexplain'), null, \core\output\notification::NOTIFY_SUCCESS);
}

// Output starts here
echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('grade_submission', 'problemexplain'));

// Student info
echo $OUTPUT->box_start('generalbox student-info');
echo html_writer::tag('h3', fullname($student));
echo html_writer::tag('p', get_string('email') . ': ' . $student->email);
echo html_writer::tag('p', get_string('status') . ': ' . get_string($submission->status, 'problemexplain'));
if ($submission->timesubmitted) {
    echo html_writer::tag('p', get_string('timesubmitted', 'problemexplain') . ': ' .
        userdate($submission->timesubmitted));
}
echo $OUTPUT->box_end();

// Display problem
echo $OUTPUT->box_start('generalbox');
echo html_writer::tag('h4', get_string('problem_text', 'problemexplain'));
echo html_writer::tag('div', format_text($problemexplain->problem_text, FORMAT_MOODLE));
echo $OUTPUT->box_end();

// Display student explanation
echo $OUTPUT->box_start('generalbox student-explanation');
echo html_writer::tag('h3', get_string('explanation_title', 'problemexplain') . ': ' .
    s($submission->explanation_title));

foreach ($steps as $step) {
    echo html_writer::start_div('step-display');
    echo html_writer::tag('h4', get_string('step', 'problemexplain', $step->step_number) . ': ' .
        s($step->step_title));
    echo html_writer::tag('div', format_text($step->step_explanation, FORMAT_PLAIN),
        array('class' => 'step-explanation'));

    if (!empty($step->step_reasoning)) {
        echo html_writer::tag('div', html_writer::tag('strong', get_string('step_reasoning', 'problemexplain')) .
            '<br>' . format_text($step->step_reasoning, FORMAT_PLAIN),
            array('class' => 'step-reasoning'));
    }
    echo html_writer::end_div();
}
echo $OUTPUT->box_end();

// Display AI evaluation if available
if ($ai_eval) {
    echo $OUTPUT->box_start('generalbox ai-evaluation');
    echo html_writer::tag('h3', get_string('ai_evaluation', 'problemexplain'));

    echo html_writer::start_tag('table', array('class' => 'generaltable'));
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('clarity_score', 'problemexplain'));
    echo html_writer::tag('td', number_format($ai_eval->clarity_score, 1) . '%');
    echo html_writer::end_tag('tr');

    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('completeness_score', 'problemexplain'));
    echo html_writer::tag('td', number_format($ai_eval->completeness_score, 1) . '%');
    echo html_writer::end_tag('tr');

    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('accuracy_score', 'problemexplain'));
    echo html_writer::tag('td', number_format($ai_eval->accuracy_score, 1) . '%');
    echo html_writer::end_tag('tr');

    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('pedagogy_score', 'problemexplain'));
    echo html_writer::tag('td', number_format($ai_eval->pedagogy_score, 1) . '%');
    echo html_writer::end_tag('tr');

    echo html_writer::start_tag('tr', array('class' => 'overall-score'));
    echo html_writer::tag('th', get_string('overall_score', 'problemexplain'));
    echo html_writer::tag('td', html_writer::tag('strong', number_format($ai_eval->overall_score, 1) . '%'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('table');

    if ($ai_eval->feedback_text) {
        echo html_writer::tag('h4', get_string('ai_feedback', 'problemexplain'));
        echo html_writer::tag('div', format_text($ai_eval->feedback_text, FORMAT_PLAIN));
    }

    if ($ai_eval->suggestions) {
        echo html_writer::tag('h4', get_string('ai_suggestions', 'problemexplain'));
        echo html_writer::tag('div', format_text($ai_eval->suggestions, FORMAT_PLAIN));
    }

    echo $OUTPUT->box_end();
}

// Grading form
echo $OUTPUT->box_start('generalbox grading-form');
echo html_writer::tag('h3', get_string('grading', 'problemexplain'));

echo html_writer::start_tag('form', array(
    'method' => 'post',
    'action' => $PAGE->url->out(false)
));
echo html_writer::input_hidden_params($PAGE->url);
echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));

echo html_writer::start_div('form-group');
echo html_writer::tag('label', get_string('grade') . ' (0-' . $problemexplain->grade . ')');
echo html_writer::empty_tag('input', array(
    'type' => 'number',
    'name' => 'grade',
    'min' => '0',
    'max' => $problemexplain->grade,
    'step' => '0.01',
    'value' => $existing_grade ? $existing_grade->grade : '',
    'class' => 'form-control',
    'required' => 'required'
));
echo html_writer::end_div();

echo html_writer::start_div('form-group');
echo html_writer::tag('label', get_string('feedback'));
echo html_writer::tag('textarea', $existing_grade ? $existing_grade->feedback : '', array(
    'name' => 'feedback',
    'rows' => '10',
    'cols' => '80',
    'class' => 'form-control'
));
echo html_writer::end_div();

echo html_writer::empty_tag('input', array(
    'type' => 'submit',
    'value' => get_string('savegrade', 'problemexplain'),
    'class' => 'btn btn-primary'
));

echo html_writer::end_tag('form');
echo $OUTPUT->box_end();

// Navigation
echo html_writer::link(
    new moodle_url('/mod/problemexplain/submissions.php', array('id' => $cm->id)),
    get_string('back_to_submissions', 'problemexplain'),
    array('class' => 'btn btn-secondary')
);

// Finish the page
echo $OUTPUT->footer();
