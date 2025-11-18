<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Manage steps - teacher interface for creating/editing steps
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT); // Course module id.
$action = optional_param('action', 'list', PARAM_ALPHA);
$stepid = optional_param('stepid', 0, PARAM_INT);

$cm = get_coursemodule_from_id('altsolutions', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$altsolutions = $DB->get_record('altsolutions', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/altsolutions:addinstance', $context);

$PAGE->set_url('/mod/altsolutions/managesteps.php', array('id' => $cm->id));
$PAGE->set_title(format_string($altsolutions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle actions.
if ($action == 'delete' && $stepid && confirm_sesskey()) {
    $DB->delete_records('altsolutions_steps', array('id' => $stepid));
    redirect($PAGE->url, get_string('deleted'), null, \core\output\notification::NOTIFY_SUCCESS);
}

if (data_submitted() && confirm_sesskey()) {
    $title = required_param('title', PARAM_TEXT);
    $description = optional_param('description', '', PARAM_RAW);
    $hinttext = optional_param('hinttext', '', PARAM_RAW);
    $stepnumber = required_param('stepnumber', PARAM_INT);

    $step = new stdClass();
    $step->title = $title;
    $step->description = $description;
    $step->hinttext = $hinttext;
    $step->stepnumber = $stepnumber;

    if ($stepid) {
        // Update existing step.
        $step->id = $stepid;
        $DB->update_record('altsolutions_steps', $step);
        $message = get_string('updated');
    } else {
        // Add new step.
        $step->altsolutionsid = $altsolutions->id;
        $step->timecreated = time();
        $DB->insert_record('altsolutions_steps', $step);
        $message = get_string('added', 'moodle');
    }

    redirect($PAGE->url, $message, null, \core\output\notification::NOTIFY_SUCCESS);
}

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($altsolutions->name));
echo $OUTPUT->heading(get_string('managesteps', 'altsolutions'), 3);

if ($action == 'add' || $action == 'edit') {
    // Show add/edit form.
    $step = null;
    if ($stepid) {
        $step = $DB->get_record('altsolutions_steps', array('id' => $stepid), '*', MUST_EXIST);
    }

    $nextstep = $DB->count_records('altsolutions_steps', array('altsolutionsid' => $altsolutions->id)) + 1;

    echo html_writer::start_tag('form', array(
        'method' => 'post',
        'action' => $PAGE->url->out()
    ));

    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'action', 'value' => $action));
    if ($stepid) {
        echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'stepid', 'value' => $stepid));
    }

    echo $OUTPUT->box_start('generalbox');

    // Step number.
    echo html_writer::start_div('form-group');
    echo html_writer::tag('label', get_string('step', 'altsolutions') . ' #', array('for' => 'stepnumber'));
    echo html_writer::empty_tag('input', array(
        'type' => 'number',
        'name' => 'stepnumber',
        'id' => 'stepnumber',
        'value' => $step ? $step->stepnumber : $nextstep,
        'min' => 1,
        'class' => 'form-control',
        'required' => 'required'
    ));
    echo html_writer::end_div();

    // Title.
    echo html_writer::start_div('form-group');
    echo html_writer::tag('label', get_string('steptitle', 'altsolutions'), array('for' => 'title'));
    echo html_writer::empty_tag('input', array(
        'type' => 'text',
        'name' => 'title',
        'id' => 'title',
        'value' => $step ? $step->title : '',
        'class' => 'form-control',
        'required' => 'required'
    ));
    echo html_writer::end_div();

    // Description.
    echo html_writer::start_div('form-group');
    echo html_writer::tag('label', get_string('stepdescription', 'altsolutions'), array('for' => 'description'));
    echo html_writer::tag('textarea', $step ? $step->description : '', array(
        'name' => 'description',
        'id' => 'description',
        'rows' => 5,
        'class' => 'form-control'
    ));
    echo html_writer::end_div();

    // Hint.
    echo html_writer::start_div('form-group');
    echo html_writer::tag('label', get_string('stephint', 'altsolutions'), array('for' => 'hinttext'));
    echo html_writer::tag('textarea', $step ? $step->hinttext : '', array(
        'name' => 'hinttext',
        'id' => 'hinttext',
        'rows' => 3,
        'class' => 'form-control'
    ));
    echo html_writer::end_div();

    // Buttons.
    echo html_writer::start_div('form-group');
    echo html_writer::tag('button', get_string('savechanges'), array(
        'type' => 'submit',
        'class' => 'btn btn-primary'
    ));
    echo ' ';
    echo html_writer::link($PAGE->url, get_string('cancel'), array('class' => 'btn btn-secondary'));
    echo html_writer::end_div();

    echo $OUTPUT->box_end();

    echo html_writer::end_tag('form');

} else {
    // List steps.
    $steps = altsolutions_get_steps($altsolutions->id);

    echo html_writer::link(
        new moodle_url('/mod/altsolutions/managesteps.php', array('id' => $cm->id, 'action' => 'add')),
        get_string('addstep', 'altsolutions'),
        array('class' => 'btn btn-primary mb-3')
    );

    if (empty($steps)) {
        echo $OUTPUT->notification(get_string('error:nosteps', 'altsolutions'), 'notifymessage');
    } else {
        echo html_writer::start_tag('table', array('class' => 'table table-striped'));
        echo html_writer::start_tag('thead');
        echo html_writer::start_tag('tr');
        echo html_writer::tag('th', '#');
        echo html_writer::tag('th', get_string('steptitle', 'altsolutions'));
        echo html_writer::tag('th', get_string('actions'));
        echo html_writer::end_tag('tr');
        echo html_writer::end_tag('thead');

        echo html_writer::start_tag('tbody');
        foreach ($steps as $step) {
            echo html_writer::start_tag('tr');
            echo html_writer::tag('td', $step->stepnumber);
            echo html_writer::tag('td', format_string($step->title));

            $actions = array();
            $actions[] = html_writer::link(
                new moodle_url('/mod/altsolutions/managesteps.php', array('id' => $cm->id, 'action' => 'edit', 'stepid' => $step->id)),
                get_string('edit')
            );
            $actions[] = html_writer::link(
                new moodle_url('/mod/altsolutions/managesteps.php', array('id' => $cm->id, 'action' => 'delete', 'stepid' => $step->id, 'sesskey' => sesskey())),
                get_string('delete'),
                array('onclick' => 'return confirm("' . get_string('areyousure', 'admin') . '");')
            );

            echo html_writer::tag('td', implode(' | ', $actions));
            echo html_writer::end_tag('tr');
        }
        echo html_writer::end_tag('tbody');
        echo html_writer::end_tag('table');
    }
}

echo html_writer::tag('p',
    html_writer::link(new moodle_url('/mod/altsolutions/view.php', array('id' => $cm->id)),
        get_string('back'), array('class' => 'btn btn-secondary'))
);

echo $OUTPUT->footer();
