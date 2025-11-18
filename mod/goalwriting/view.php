<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Prints a particular instance of goalwriting
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // goalwriting instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('goalwriting', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $goalwriting = $DB->get_record('goalwriting', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $goalwriting = $DB->get_record('goalwriting', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $goalwriting->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('goalwriting', $goalwriting->id, $course->id, false, MUST_EXIST);
} else {
    print_error('missingidandcmid', 'mod_goalwriting');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger course_module_viewed event
$event = \core\event\course_module_viewed::create(array(
    'objectid' => $goalwriting->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot($cm->modname, $goalwriting);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/goalwriting/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($goalwriting->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle form submissions
if (has_capability('mod/goalwriting:submit', $context)) {
    $action = optional_param('action', '', PARAM_ALPHA);

    if ($action == 'save' || $action == 'submit') {
        require_sesskey();

        $submission = goalwriting_get_user_submission($goalwriting->id, $USER->id);
        $submission->goaltext = required_param('goaltext', PARAM_RAW);
        $submission->goalformat = FORMAT_HTML;
        $submission->status = ($action == 'submit') ? 'submitted' : 'draft';

        if ($action == 'submit') {
            $submission->timesubmitted = time();
        }

        if (goalwriting_save_submission($submission)) {
            $message = ($action == 'submit') ?
                get_string('goalsubmitted', 'goalwriting') :
                get_string('goalsaved', 'goalwriting');
            redirect($PAGE->url, $message, null, \core\output\notification::NOTIFY_SUCCESS);
        }
    }
}

echo $OUTPUT->header();

// Check if user can view submissions (teacher)
if (has_capability('mod/goalwriting:viewallsubmissions', $context)) {
    echo html_writer::tag('div',
        html_writer::link(new moodle_url('/mod/goalwriting/submissions.php', array('id' => $cm->id)),
            get_string('viewsubmissions', 'goalwriting'),
            array('class' => 'btn btn-primary mb-3')),
        array('class' => 'mb-3')
    );
}

// Display the activity description
echo $OUTPUT->box_start('generalbox mod_introbox', 'goalwritingintro');
echo format_module_intro('goalwriting', $goalwriting, $cm->id);
echo $OUTPUT->box_end();

// Display problem text if available
if (!empty($goalwriting->problemtext)) {
    echo $OUTPUT->heading(get_string('problemtext', 'goalwriting'), 3);
    echo $OUTPUT->box(format_text($goalwriting->problemtext, $goalwriting->problemformat), 'generalbox');
}

// Display student submission form if they have permission
if (has_capability('mod/goalwriting:submit', $context)) {
    $submission = goalwriting_get_user_submission($goalwriting->id, $USER->id);

    echo $OUTPUT->heading(get_string('yourgoal', 'goalwriting'), 3);

    // Show status
    $statustext = get_string($submission->status, 'goalwriting');
    $statusclass = ($submission->status == 'submitted') ? 'badge-success' : 'badge-secondary';
    echo html_writer::tag('div',
        get_string('status', 'goalwriting') . ': ' .
        html_writer::tag('span', $statustext, array('class' => 'badge ' . $statusclass)),
        array('class' => 'mb-2')
    );

    // Show teacher feedback if available
    if (!empty($submission->teacherfeedback)) {
        echo $OUTPUT->heading(get_string('teacherfeedback', 'goalwriting'), 4);
        echo $OUTPUT->box(format_text($submission->teacherfeedback, $submission->teacherfeedbackformat),
            'generalbox feedback-box');

        if ($submission->grade !== null) {
            echo html_writer::tag('div',
                get_string('grade', 'goalwriting') . ': ' . $submission->grade,
                array('class' => 'grade-display')
            );
        }
    }

    // Check if student can submit/resubmit
    $cansubmit = ($submission->status == 'draft') ||
                 ($goalwriting->allowresubmit && $submission->status == 'reviewed');

    if ($cansubmit) {
        echo html_writer::start_tag('form', array(
            'method' => 'post',
            'action' => $PAGE->url,
            'class' => 'goalwriting-form'
        ));

        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'sesskey',
            'value' => sesskey()
        ));

        echo html_writer::tag('label', get_string('writegoal', 'goalwriting'), array('for' => 'goaltext'));

        echo html_writer::tag('textarea',
            s($submission->goaltext),
            array(
                'name' => 'goaltext',
                'id' => 'goaltext',
                'rows' => 10,
                'class' => 'form-control',
                'placeholder' => get_string('goalplaceholder', 'goalwriting')
            )
        );

        echo html_writer::tag('div',
            get_string('wordcount', 'goalwriting', html_writer::tag('span', $submission->wordcount, array('id' => 'wordcount'))),
            array('class' => 'word-count mt-2 mb-2')
        );

        echo html_writer::start_tag('div', array('class' => 'form-buttons mt-3'));

        echo html_writer::empty_tag('input', array(
            'type' => 'submit',
            'name' => 'action',
            'value' => 'save',
            'class' => 'btn btn-secondary mr-2',
            'title' => get_string('savedraft', 'goalwriting')
        ));

        echo html_writer::empty_tag('input', array(
            'type' => 'submit',
            'name' => 'action',
            'value' => 'submit',
            'class' => 'btn btn-primary',
            'title' => get_string('submitgoal', 'goalwriting'),
            'onclick' => 'return confirmSubmit();'
        ));

        echo html_writer::end_tag('div');
        echo html_writer::end_tag('form');

        // Add JavaScript for word counting
        echo html_writer::tag('script', "
            function countWords(text) {
                text = text.replace(/<[^>]*>/g, '');
                text = text.replace(/\s+/g, ' ');
                var words = text.trim().split(' ');
                return words.filter(function(word) { return word.length > 0; }).length;
            }

            function confirmSubmit() {
                var text = document.getElementById('goaltext').value;
                var wordCount = countWords(text);
                var minWords = " . $goalwriting->minwords . ";
                var maxWords = " . $goalwriting->maxwords . ";

                if (wordCount < minWords) {
                    alert('" . get_string('errorminwords', 'goalwriting', $goalwriting->minwords) . "');
                    return false;
                }

                if (wordCount > maxWords) {
                    alert('" . get_string('errormaxwords', 'goalwriting', $goalwriting->maxwords) . "');
                    return false;
                }

                return confirm('제출하시겠습니까? / Are you sure you want to submit?');
            }

            document.getElementById('goaltext').addEventListener('input', function() {
                var wordCount = countWords(this.value);
                document.getElementById('wordcount').textContent = wordCount;
            });
        ", array('type' => 'text/javascript'));

    } else {
        echo $OUTPUT->box(format_text($submission->goaltext, $submission->goalformat), 'generalbox');
        echo html_writer::tag('div', get_string('wordcount', 'goalwriting', $submission->wordcount),
            array('class' => 'word-count mt-2'));
    }
}

echo $OUTPUT->footer();
