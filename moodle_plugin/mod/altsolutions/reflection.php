<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Reflection page - students reflect on their problem-solving process
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT); // Course module id.

$cm = get_coursemodule_from_id('altsolutions', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$altsolutions = $DB->get_record('altsolutions', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/altsolutions:submit', $context);

// Set up the page.
$PAGE->set_url('/mod/altsolutions/reflection.php', array('id' => $cm->id));
$PAGE->set_title(format_string($altsolutions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle form submission.
if (data_submitted() && confirm_sesskey()) {
    $data = new stdClass();
    $data->altsolutionsid = $altsolutions->id;
    $data->mosteffective = required_param('mosteffective', PARAM_TEXT);
    $data->learned = required_param('learned', PARAM_TEXT);
    $data->wouldchange = required_param('wouldchange', PARAM_TEXT);

    altsolutions_save_reflection($data);

    redirect(new moodle_url('/mod/altsolutions/summary.php', array('id' => $cm->id)));
}

// Get existing reflection if any.
$reflection = $DB->get_record('altsolutions_reflections', array(
    'altsolutionsid' => $altsolutions->id,
    'userid' => $USER->id
));

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($altsolutions->name));
echo $OUTPUT->heading(get_string('reflection', 'altsolutions'), 3);

echo html_writer::tag('p', get_string('completereflection', 'altsolutions'), array('class' => 'lead'));

// Start form.
echo html_writer::start_tag('form', array(
    'method' => 'post',
    'action' => $PAGE->url->out()
));

echo html_writer->empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));

// Most effective approach.
echo $OUTPUT->box_start('generalbox mb-3');
echo html_writer::tag('label', get_string('mosteffective', 'altsolutions'), array('for' => 'mosteffective', 'class' => 'font-weight-bold'));
echo html_writer::tag('textarea', $reflection ? $reflection->mosteffective : '', array(
    'name' => 'mosteffective',
    'id' => 'mosteffective',
    'rows' => 4,
    'class' => 'form-control',
    'required' => 'required'
));
echo $OUTPUT->box_end();

// What was learned.
echo $OUTPUT->box_start('generalbox mb-3');
echo html_writer::tag('label', get_string('whatlearned', 'altsolutions'), array('for' => 'learned', 'class' => 'font-weight-bold'));
echo html_writer::tag('textarea', $reflection ? $reflection->learned : '', array(
    'name' => 'learned',
    'id' => 'learned',
    'rows' => 4,
    'class' => 'form-control',
    'required' => 'required'
));
echo $OUTPUT->box_end();

// What would change.
echo $OUTPUT->box_start('generalbox mb-3');
echo html_writer::tag('label', get_string('whatwouldchange', 'altsolutions'), array('for' => 'wouldchange', 'class' => 'font-weight-bold'));
echo html_writer::tag('textarea', $reflection ? $reflection->wouldchange : '', array(
    'name' => 'wouldchange',
    'id' => 'wouldchange',
    'rows' => 4,
    'class' => 'form-control',
    'required' => 'required'
));
echo $OUTPUT->box_end();

// Submit button.
echo html_writer::start_div('form-group');
echo html_writer::tag('button', get_string('submitreflection', 'altsolutions'), array(
    'type' => 'submit',
    'class' => 'btn btn-primary'
));
echo html_writer::end_div();

echo html_writer::end_tag('form');

echo $OUTPUT->footer();
