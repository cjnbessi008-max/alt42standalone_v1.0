<?php
/**
 * Prints a particular instance of problemexplain
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Course module ID
$id = optional_param('id', 0, PARAM_INT);

// Activity instance ID
$p = optional_param('p', 0, PARAM_INT);

if ($id) {
    $cm = get_coursemodule_from_id('problemexplain', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $problemexplain = $DB->get_record('problemexplain', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($p) {
    $problemexplain = $DB->get_record('problemexplain', array('id' => $p), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $problemexplain->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('problemexplain', $problemexplain->id, $course->id, false, MUST_EXIST);
} else {
    print_error('missingidandcmid', 'problemexplain');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/problemexplain:view', $context);

// Trigger course module viewed event
$event = \mod_problemexplain\event\course_module_viewed::create(array(
    'objectid' => $problemexplain->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('problemexplain', $problemexplain);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/problemexplain/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($problemexplain->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get or create submission for current user
$submission = $DB->get_record('problemexplain_submissions', array(
    'problemexplain_id' => $problemexplain->id,
    'userid' => $USER->id
));

if (!$submission) {
    // Create a new submission
    $submission = new stdClass();
    $submission->problemexplain_id = $problemexplain->id;
    $submission->userid = $USER->id;
    $submission->status = 'draft';
    $submission->timecreated = time();
    $submission->timemodified = time();
    $submission->id = $DB->insert_record('problemexplain_submissions', $submission);
}

// Get steps for this submission
$steps = $DB->get_records('problemexplain_steps',
    array('submission_id' => $submission->id),
    'step_number ASC'
);

// Get AI evaluation if exists
$ai_eval = $DB->get_record('problemexplain_ai_eval', array('submission_id' => $submission->id));

// Get grade if exists
$grade = $DB->get_record('problemexplain_grades', array('submission_id' => $submission->id));

// Output starts here
echo $OUTPUT->header();

// Display the activity introduction
echo $OUTPUT->heading(format_string($problemexplain->name));

if ($problemexplain->intro) {
    echo $OUTPUT->box(format_module_intro('problemexplain', $problemexplain, $cm->id), 'generalbox', 'intro');
}

// Display the problem
echo $OUTPUT->box_start('generalbox problembox');
echo html_writer::tag('h3', get_string('problem_text', 'problemexplain'));
echo html_writer::tag('div', format_text($problemexplain->problem_text, FORMAT_MOODLE), array('class' => 'problem-text'));
echo html_writer::tag('p', html_writer::tag('strong', get_string('problem_type', 'problemexplain') . ': ') .
    get_string($problemexplain->problem_type, 'problemexplain'), array('class' => 'problem-type'));
echo $OUTPUT->box_end();

// Display teaching prompts
echo $OUTPUT->box_start('generalbox teachingprompts');
echo html_writer::tag('h4', get_string('howtoexplain', 'problemexplain'));
echo html_writer::tag('p', get_string('teaching_prompt', 'problemexplain'));
echo html_writer::start_tag('ul');
echo html_writer::tag('li', get_string('clarity_prompt', 'problemexplain'));
echo html_writer::tag('li', get_string('reasoning_prompt', 'problemexplain'));
echo html_writer::tag('li', get_string('example_prompt', 'problemexplain'));
echo html_writer::end_tag('ul');
echo $OUTPUT->box_end();

// Display submission status
echo html_writer::start_div('submission-status');
echo html_writer::tag('h4', get_string('status', 'problemexplain') . ': ' .
    html_writer::tag('span', get_string($submission->status, 'problemexplain'),
        array('class' => 'badge badge-' . $submission->status)));

if ($submission->status == 'draft') {
    echo $OUTPUT->notification(get_string('warning_draft', 'problemexplain'), 'notifywarning');
}
echo html_writer::end_div();

// Display explanation form
if ($submission->status == 'draft' || $submission->status == 'submitted') {
    require_once(__DIR__ . '/explanation_form.php');

    $formdata = new stdClass();
    $formdata->id = $cm->id;
    $formdata->submission_id = $submission->id;
    $formdata->explanation_title = $submission->explanation_title;

    // Add existing steps to form data
    $stepnum = 1;
    foreach ($steps as $step) {
        $formdata->{'step_title_' . $stepnum} = $step->step_title;
        $formdata->{'step_explanation_' . $stepnum} = $step->step_explanation;
        $formdata->{'step_reasoning_' . $stepnum} = $step->step_reasoning;
        $stepnum++;
    }
    $formdata->num_steps = count($steps);

    $mform = new explanation_form(null, array(
        'problemexplain' => $problemexplain,
        'submission' => $submission
    ));

    $mform->set_data($formdata);

    if ($mform->is_cancelled()) {
        redirect(new moodle_url('/course/view.php', array('id' => $course->id)));
    } else if ($data = $mform->get_data()) {
        // Process form submission
        require_once(__DIR__ . '/classes/submission_handler.php');
        $handler = new \mod_problemexplain\submission_handler();
        $handler->save_submission($data, $problemexplain, $submission);

        redirect($PAGE->url, get_string('submission_saved', 'problemexplain'), null, \core\output\notification::NOTIFY_SUCCESS);
    }

    $mform->display();
}

// Display AI evaluation if available
if ($ai_eval && $submission->status != 'draft') {
    echo $OUTPUT->box_start('generalbox ai-evaluation');
    echo html_writer::tag('h3', get_string('ai_evaluation', 'problemexplain'));

    echo html_writer::start_tag('table', array('class' => 'generaltable ai-scores'));
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('clarity_score', 'problemexplain'));
    echo html_writer::tag('td', number_format($ai_eval->clarity_score, 1) . '%',
        array('class' => 'score-cell'));
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
        echo html_writer::tag('div', format_text($ai_eval->feedback_text, FORMAT_PLAIN),
            array('class' => 'ai-feedback-text'));
    }

    if ($ai_eval->suggestions) {
        echo html_writer::tag('h4', get_string('ai_suggestions', 'problemexplain'));
        echo html_writer::tag('div', format_text($ai_eval->suggestions, FORMAT_PLAIN),
            array('class' => 'ai-suggestions'));
    }

    echo $OUTPUT->box_end();
}

// Display teacher grade if available
if ($grade) {
    echo $OUTPUT->box_start('generalbox teacher-grade');
    echo html_writer::tag('h3', get_string('grade'));
    echo html_writer::tag('p', html_writer::tag('strong', $grade->grade . ' / ' . $problemexplain->grade));

    if ($grade->feedback) {
        echo html_writer::tag('h4', get_string('feedback'));
        echo html_writer::tag('div', format_text($grade->feedback, FORMAT_MOODLE));
    }
    echo $OUTPUT->box_end();
}

// Finish the page
echo $OUTPUT->footer();
