<?php
// This file is part of Moodle - http://moodle.org/

/**
 * View all submissions for teachers
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT); // Course_module ID
$userid = optional_param('userid', 0, PARAM_INT); // User ID for individual submission view

$cm = get_coursemodule_from_id('goalwriting', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$goalwriting = $DB->get_record('goalwriting', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/goalwriting:viewallsubmissions', $context);

$PAGE->set_url('/mod/goalwriting/submissions.php', array('id' => $cm->id));
$PAGE->set_title(format_string($goalwriting->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle feedback submission
if (has_capability('mod/goalwriting:grade', $context)) {
    $action = optional_param('action', '', PARAM_ALPHA);

    if ($action == 'savefeedback' && $userid) {
        require_sesskey();

        $submission = $DB->get_record('goalwriting_submissions',
            array('goalwritingid' => $goalwriting->id, 'userid' => $userid), '*', MUST_EXIST);

        $submission->teacherfeedback = optional_param('teacherfeedback', '', PARAM_RAW);
        $submission->teacherfeedbackformat = FORMAT_HTML;
        $submission->grade = optional_param('grade', null, PARAM_INT);
        $submission->status = 'reviewed';
        $submission->timemodified = time();

        $DB->update_record('goalwriting_submissions', $submission);

        // Update gradebook
        if ($submission->grade !== null) {
            goalwriting_update_grades($goalwriting, $userid, $submission->grade);
        }

        redirect($PAGE->url, get_string('feedbacksaved', 'goalwriting'),
            null, \core\output\notification::NOTIFY_SUCCESS);
    }
}

echo $OUTPUT->header();

echo html_writer::link(new moodle_url('/mod/goalwriting/view.php', array('id' => $cm->id)),
    '← ' . get_string('back'), array('class' => 'btn btn-secondary mb-3'));

echo $OUTPUT->heading(get_string('viewsubmissions', 'goalwriting'));

// If viewing individual submission
if ($userid) {
    $submission = $DB->get_record_sql(
        "SELECT s.*, u.firstname, u.lastname, u.email
         FROM {goalwriting_submissions} s
         JOIN {user} u ON s.userid = u.id
         WHERE s.goalwritingid = :goalwritingid AND s.userid = :userid",
        array('goalwritingid' => $goalwriting->id, 'userid' => $userid)
    );

    if ($submission) {
        echo $OUTPUT->heading(fullname($submission), 3);

        $statustext = get_string($submission->status, 'goalwriting');
        echo html_writer::tag('p', get_string('status', 'goalwriting') . ': ' . $statustext);

        if ($submission->timesubmitted) {
            echo html_writer::tag('p',
                get_string('submissiondate', 'goalwriting') . ': ' .
                userdate($submission->timesubmitted));
        }

        echo html_writer::tag('p', get_string('wordcount', 'goalwriting', $submission->wordcount));

        echo $OUTPUT->heading(get_string('yourgoal', 'goalwriting'), 4);
        echo $OUTPUT->box(format_text($submission->goaltext, $submission->goalformat), 'generalbox');

        // Feedback form for teachers
        if (has_capability('mod/goalwriting:grade', $context)) {
            echo $OUTPUT->heading(get_string('providefeedback', 'goalwriting'), 4);

            echo html_writer::start_tag('form', array(
                'method' => 'post',
                'action' => $PAGE->url,
                'class' => 'feedback-form'
            ));

            echo html_writer::empty_tag('input', array(
                'type' => 'hidden',
                'name' => 'sesskey',
                'value' => sesskey()
            ));

            echo html_writer::empty_tag('input', array(
                'type' => 'hidden',
                'name' => 'userid',
                'value' => $userid
            ));

            echo html_writer::empty_tag('input', array(
                'type' => 'hidden',
                'name' => 'action',
                'value' => 'savefeedback'
            ));

            echo html_writer::tag('label', get_string('teacherfeedback', 'goalwriting'),
                array('for' => 'teacherfeedback'));

            echo html_writer::tag('textarea',
                s($submission->teacherfeedback),
                array(
                    'name' => 'teacherfeedback',
                    'id' => 'teacherfeedback',
                    'rows' => 5,
                    'class' => 'form-control mb-3'
                )
            );

            echo html_writer::tag('label', get_string('grade', 'goalwriting') . ' (0-100)',
                array('for' => 'grade'));

            echo html_writer::empty_tag('input', array(
                'type' => 'number',
                'name' => 'grade',
                'id' => 'grade',
                'min' => 0,
                'max' => 100,
                'value' => $submission->grade,
                'class' => 'form-control mb-3'
            ));

            echo html_writer::empty_tag('input', array(
                'type' => 'submit',
                'value' => get_string('savefeedback', 'goalwriting'),
                'class' => 'btn btn-primary'
            ));

            echo html_writer::end_tag('form');
        }
    } else {
        echo $OUTPUT->notification(get_string('nosubmissions', 'goalwriting'));
    }

} else {
    // List all submissions
    $submissions = goalwriting_get_all_submissions($goalwriting->id);

    if (empty($submissions)) {
        echo $OUTPUT->notification(get_string('nosubmissions', 'goalwriting'));
    } else {
        $table = new html_table();
        $table->head = array(
            get_string('studentname', 'goalwriting'),
            get_string('status', 'goalwriting'),
            get_string('submissiondate', 'goalwriting'),
            get_string('wordcount', 'goalwriting'),
            get_string('grade', 'goalwriting'),
            get_string('action')
        );
        $table->attributes['class'] = 'generaltable';

        foreach ($submissions as $submission) {
            $studentname = fullname($submission);
            $status = get_string($submission->status, 'goalwriting');
            $submissiondate = $submission->timesubmitted ?
                userdate($submission->timesubmitted) : '-';
            $wordcount = $submission->wordcount;
            $grade = $submission->grade !== null ? $submission->grade : '-';

            $viewurl = new moodle_url('/mod/goalwriting/submissions.php',
                array('id' => $cm->id, 'userid' => $submission->userid));
            $viewlink = html_writer::link($viewurl, get_string('viewsubmission', 'goalwriting'),
                array('class' => 'btn btn-sm btn-primary'));

            $table->data[] = array(
                $studentname,
                $status,
                $submissiondate,
                $wordcount,
                $grade,
                $viewlink
            );
        }

        echo html_writer::table($table);
    }
}

echo $OUTPUT->footer();
