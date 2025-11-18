<?php
/**
 * Teacher view of all submissions
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Course module ID
$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('problemexplain', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$problemexplain = $DB->get_record('problemexplain', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/problemexplain:grade', $context);

$PAGE->set_url('/mod/problemexplain/submissions.php', array('id' => $cm->id));
$PAGE->set_title(format_string($problemexplain->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get all submissions
$sql = "SELECT s.*, u.firstname, u.lastname, u.email,
               g.grade, g.feedback as teacher_feedback,
               ae.overall_score as ai_score
        FROM {problemexplain_submissions} s
        JOIN {user} u ON u.id = s.userid
        LEFT JOIN {problemexplain_grades} g ON g.submission_id = s.id
        LEFT JOIN {problemexplain_ai_eval} ae ON ae.submission_id = s.id
        WHERE s.problemexplain_id = :problemexplainid
        ORDER BY s.timesubmitted DESC, s.timemodified DESC";

$submissions = $DB->get_records_sql($sql, array('problemexplainid' => $problemexplain->id));

// Output starts here
echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('allsubmissions', 'problemexplain'));

// Summary statistics
$total = count($submissions);
$submitted = 0;
$graded = 0;
$draft = 0;

foreach ($submissions as $submission) {
    if ($submission->status == 'submitted' || $submission->status == 'graded') {
        $submitted++;
    }
    if ($submission->status == 'draft') {
        $draft++;
    }
    if (isset($submission->grade)) {
        $graded++;
    }
}

echo html_writer::start_div('submission-stats');
echo html_writer::tag('p', get_string('total_submissions', 'problemexplain') . ': ' . $total);
echo html_writer::tag('p', get_string('submitted', 'problemexplain') . ': ' . $submitted);
echo html_writer::tag('p', get_string('graded', 'problemexplain') . ': ' . $graded);
echo html_writer::tag('p', get_string('draft', 'problemexplain') . ': ' . $draft);
echo html_writer::end_div();

// Submissions table
if (empty($submissions)) {
    echo $OUTPUT->notification(get_string('no_submissions', 'problemexplain'), 'notifyinfo');
} else {
    $table = new html_table();
    $table->head = array(
        get_string('student'),
        get_string('explanation_title', 'problemexplain'),
        get_string('status'),
        get_string('timesubmitted', 'problemexplain'),
        get_string('ai_score', 'problemexplain'),
        get_string('grade'),
        get_string('actions')
    );
    $table->attributes['class'] = 'generaltable';

    foreach ($submissions as $submission) {
        $row = array();

        // Student name
        $row[] = html_writer::link(
            new moodle_url('/user/view.php', array('id' => $submission->userid, 'course' => $course->id)),
            fullname($submission)
        );

        // Explanation title
        $row[] = s($submission->explanation_title);

        // Status
        $statusclass = 'badge-' . $submission->status;
        $row[] = html_writer::tag('span', get_string($submission->status, 'problemexplain'),
            array('class' => 'badge ' . $statusclass));

        // Time submitted
        if ($submission->timesubmitted) {
            $row[] = userdate($submission->timesubmitted);
        } else {
            $row[] = '-';
        }

        // AI score
        if ($submission->ai_score) {
            $row[] = number_format($submission->ai_score, 1) . '%';
        } else {
            $row[] = '-';
        }

        // Teacher grade
        if ($submission->grade) {
            $row[] = $submission->grade . ' / ' . $problemexplain->grade;
        } else {
            $row[] = html_writer::tag('em', get_string('notgraded', 'problemexplain'));
        }

        // Actions
        $actions = array();
        $actions[] = html_writer::link(
            new moodle_url('/mod/problemexplain/grade.php', array(
                'id' => $cm->id,
                'submissionid' => $submission->id
            )),
            get_string('grade_submission', 'problemexplain'),
            array('class' => 'btn btn-sm btn-primary')
        );

        $row[] = implode(' ', $actions);

        $table->data[] = $row;
    }

    echo html_writer::table($table);
}

// Finish the page
echo $OUTPUT->footer();
