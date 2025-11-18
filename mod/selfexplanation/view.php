<?php
/**
 * Prints a particular instance of selfexplanation
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // selfexplanation instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('selfexplanation', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $selfexplanation  = $DB->get_record('selfexplanation', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $selfexplanation  = $DB->get_record('selfexplanation', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $selfexplanation->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('selfexplanation', $selfexplanation->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger course module viewed event.
selfexplanation_view($selfexplanation, $course, $cm, $context);

// Print the page header.
$PAGE->set_url('/mod/selfexplanation/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($selfexplanation->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Check capabilities
$cansubmit = has_capability('mod/selfexplanation:submit', $context);
$canview = has_capability('mod/selfexplanation:view', $context);
$cangrade = has_capability('mod/selfexplanation:grade', $context);
$canviewresponses = has_capability('mod/selfexplanation:viewresponses', $context);

// Handle form submission
if ($cansubmit && $_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $responsetext = required_param('responsetext', PARAM_RAW);
    $action = optional_param('action', 'submit', PARAM_ALPHA);

    $status = ($action === 'save') ? 'draft' : 'submitted';

    // Validate minimum words
    $wordcount = selfexplanation_count_words($responsetext);
    if ($status === 'submitted' && $wordcount < $selfexplanation->minwords) {
        $error = get_string('error:tooshort', 'selfexplanation', $selfexplanation->minwords);
    } else {
        // Submit the response
        selfexplanation_submit_response($selfexplanation->id, $USER->id, $responsetext, $status);

        if ($status === 'submitted') {
            redirect($PAGE->url, get_string('responsesubmitted', 'selfexplanation'), null, \core\output\notification::NOTIFY_SUCCESS);
        } else {
            redirect($PAGE->url, get_string('responsesaved', 'selfexplanation'), null, \core\output\notification::NOTIFY_INFO);
        }
    }
}

// Get user's existing response
$userresponse = selfexplanation_get_user_response($selfexplanation->id, $USER->id);

// Output starts here
echo $OUTPUT->header();

// Show introduction
echo $OUTPUT->heading(format_string($selfexplanation->name));

if ($selfexplanation->intro) {
    echo $OUTPUT->box(format_module_intro('selfexplanation', $selfexplanation, $cm->id), 'generalbox mod_introbox', 'selfexplanationintro');
}

// Teacher view: show link to view all responses
if ($canviewresponses) {
    echo html_writer::tag('div',
        html_writer::link(
            new moodle_url('/mod/selfexplanation/report.php', array('id' => $cm->id)),
            get_string('viewresponses', 'selfexplanation'),
            array('class' => 'btn btn-primary')
        ),
        array('class' => 'mb-3')
    );
}

// Student view: show prompt and response form
if ($cansubmit) {
    // Display the prompt
    $prompttext = $selfexplanation->prompttext;
    if (empty($prompttext) || $selfexplanation->prompttype !== 'custom') {
        $prompttext = get_string('prompttype_' . $selfexplanation->prompttype, 'selfexplanation');
    }

    echo $OUTPUT->box_start('generalbox');
    echo html_writer::tag('h3', $prompttext, array('class' => 'prompt-question'));

    // Show existing response status
    if ($userresponse) {
        $statusclass = 'badge-';
        switch ($userresponse->status) {
            case 'draft':
                $statusclass .= 'secondary';
                break;
            case 'submitted':
                $statusclass .= 'success';
                break;
            case 'graded':
                $statusclass .= 'primary';
                break;
        }

        echo html_writer::tag('p',
            get_string('status', 'selfexplanation') . ': ' .
            html_writer::tag('span',
                get_string($userresponse->status, 'selfexplanation'),
                array('class' => 'badge ' . $statusclass)
            )
        );

        if ($userresponse->grade !== null && $selfexplanation->displayfeedback) {
            echo html_writer::tag('p',
                get_string('grade', 'selfexplanation') . ': ' . $userresponse->grade
            );
        }

        if (!empty($userresponse->feedback) && $selfexplanation->displayfeedback) {
            echo $OUTPUT->box(
                html_writer::tag('strong', get_string('feedback', 'selfexplanation') . ':') . '<br>' .
                format_text($userresponse->feedback, $userresponse->feedbackformat),
                'generalbox feedback-box'
            );
        }
    }

    // Show response form
    $canedit = !$userresponse || $userresponse->status === 'draft' || $selfexplanation->allowresubmit;

    if ($canedit) {
        $formaction = new moodle_url('/mod/selfexplanation/view.php', array('id' => $cm->id));

        echo html_writer::start_tag('form', array(
            'method' => 'post',
            'action' => $formaction->out(),
            'class' => 'selfexplanation-response-form'
        ));

        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'sesskey',
            'value' => sesskey()
        ));

        echo html_writer::tag('label', get_string('responsetext', 'selfexplanation'), array('for' => 'responsetext'));
        echo html_writer::tag('textarea',
            $userresponse ? $userresponse->responsetext : '',
            array(
                'id' => 'responsetext',
                'name' => 'responsetext',
                'rows' => '10',
                'cols' => '80',
                'class' => 'form-control',
                'required' => 'required'
            )
        );

        // Word count display
        echo html_writer::tag('p',
            html_writer::tag('small',
                html_writer::tag('span', '0', array('id' => 'wordcount')) . ' ' .
                get_string('minwordsrequired', 'selfexplanation', $selfexplanation->minwords),
                array('class' => 'text-muted')
            )
        );

        // Error display
        if (isset($error)) {
            echo html_writer::tag('div', $error, array('class' => 'alert alert-danger'));
        }

        // Buttons
        echo html_writer::tag('div',
            html_writer::empty_tag('input', array(
                'type' => 'submit',
                'name' => 'action',
                'value' => 'save',
                'class' => 'btn btn-secondary mr-2',
                'onclick' => 'this.form.action.value="save"'
            )) .
            html_writer::empty_tag('input', array(
                'type' => 'submit',
                'name' => 'action',
                'value' => 'submit',
                'class' => 'btn btn-primary',
                'onclick' => 'this.form.action.value="submit"'
            )),
            array('class' => 'mt-2')
        );

        echo html_writer::end_tag('form');

        // Add JavaScript for word counter
        $PAGE->requires->js_call_amd('mod_selfexplanation/wordcount', 'init');
    } else {
        echo html_writer::tag('div',
            format_text($userresponse->responsetext, $userresponse->responseformat),
            array('class' => 'response-display')
        );
    }

    echo $OUTPUT->box_end();
} else if (!$canview) {
    notice(get_string('error:cannotsubmit', 'selfexplanation'), new moodle_url('/course/view.php', array('id' => $course->id)));
}

// Finish the page
echo $OUTPUT->footer();
