<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Prints a particular instance of exponentialburst
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID

if ($id) {
    $cm = get_coursemodule_from_id('exponentialburst', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $exponentialburst = $DB->get_record('exponentialburst', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/exponentialburst:view', $context);

// Log the view.
$event = \mod_exponentialburst\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $exponentialburst);
$event->trigger();

// Set up the page.
$PAGE->set_url('/mod/exponentialburst/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($exponentialburst->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get user progress
$progress = exponentialburst_get_progress($exponentialburst->id, $USER->id);

echo $OUTPUT->header();

echo $OUTPUT->heading($exponentialburst->name);

// Display the intro
if ($exponentialburst->intro) {
    echo $OUTPUT->box(format_module_intro('exponentialburst', $exponentialburst, $cm->id), 'generalbox mod_introbox', 'exponentialburstintro');
}

// Display progress information
echo html_writer::start_div('exponentialburst-progress-info');
echo html_writer::tag('p', get_string('currentlevel', 'exponentialburst', $progress->currentlevel));
echo html_writer::tag('p', get_string('bestscore', 'exponentialburst', $progress->bestscore));
echo html_writer::tag('p', get_string('totalbursts', 'exponentialburst', $progress->totalbursts));
echo html_writer::end_div();

// Include the smartphone UI container
echo html_writer::start_div('exponentialburst-container');

// Left side: Instructions and controls
echo html_writer::start_div('exponentialburst-left-panel');
echo html_writer::tag('h3', get_string('instructions', 'exponentialburst'));
echo html_writer::end_div();

// Right side: Smartphone display
echo html_writer::start_div('exponentialburst-smartphone-container');
echo html_writer::start_div('smartphone-frame');
echo html_writer::start_div('smartphone-screen', array('id' => 'smartphone-screen'));

// Loading indicator
echo html_writer::div(get_string('loading', 'exponentialburst'), 'loading-indicator', array('id' => 'loading-indicator'));

// Main app container
echo html_writer::start_div('burst-app', array('id' => 'burst-app', 'style' => 'display:none;'));

// Question display
echo html_writer::start_div('question-container');
echo html_writer::tag('div', '', array('id' => 'question-text', 'class' => 'question-text'));
echo html_writer::end_div();

// Answer input
echo html_writer::start_div('answer-container');
echo html_writer::empty_tag('input', array(
    'type' => 'number',
    'id' => 'answer-input',
    'class' => 'answer-input',
    'placeholder' => 'Your answer...'
));
echo html_writer::tag('button', get_string('submit', 'exponentialburst'), array(
    'id' => 'submit-btn',
    'class' => 'submit-button'
));
echo html_writer::end_div();

// Canvas for burst visualization
echo html_writer::tag('canvas', '', array(
    'id' => 'burst-canvas',
    'class' => 'burst-canvas',
    'width' => '350',
    'height' => '500'
));

// Feedback area
echo html_writer::tag('div', '', array('id' => 'feedback-area', 'class' => 'feedback-area'));

echo html_writer::end_div(); // burst-app

echo html_writer::end_div(); // smartphone-screen
echo html_writer::end_div(); // smartphone-frame
echo html_writer::end_div(); // smartphone-container

echo html_writer::end_div(); // main container

// Pass data to JavaScript
$jsdata = array(
    'cmid' => $cm->id,
    'activityid' => $exponentialburst->id,
    'userid' => $USER->id,
    'difficulty' => $exponentialburst->difficulty,
    'maxvalue' => $exponentialburst->maxvalue,
    'showgraph' => $exponentialburst->showgraph,
    'wwwroot' => $CFG->wwwroot
);

echo html_writer::script('var EXPONENTIALBURST_CONFIG = ' . json_encode($jsdata) . ';');

// Include CSS and JavaScript
$PAGE->requires->css('/mod/exponentialburst/styles.css');
$PAGE->requires->js('/mod/exponentialburst/module.js');

echo $OUTPUT->footer();
