<?php
/**
 * Prints a particular instance of blossomsequence
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // blossomsequence instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('blossomsequence', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $blossomsequence  = $DB->get_record('blossomsequence', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $blossomsequence  = $DB->get_record('blossomsequence', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $blossomsequence->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('blossomsequence', $blossomsequence->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

$event = \mod_blossomsequence\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $blossomsequence);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/blossomsequence/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($blossomsequence->name));
$PAGE->set_heading(format_string($course->fullname));

// Get the sequence data
$sequenceParams = array();
if (!empty($blossomsequence->sequencedata)) {
    $sequenceParams['custom'] = $blossomsequence->sequencedata;
}

$sequence = blossomsequence_generate_sequence(
    $blossomsequence->sequencetype,
    $blossomsequence->petalcount,
    $sequenceParams
);

// Get user's previous attempts
$attempts = $DB->get_records('blossomsequence_attempts',
    array('blossomsequenceid' => $blossomsequence->id, 'userid' => $USER->id),
    'attempt DESC'
);

// Output starts here
echo $OUTPUT->header();

// Conditions to show the intro
if ($blossomsequence->intro) {
    echo $OUTPUT->box(format_module_intro('blossomsequence', $blossomsequence, $cm->id), 'generalbox mod_introbox', 'blossomsequenceintro');
}

// Display the blossom sequence interface
echo '<div class="blossomsequence-container">';
echo '<div class="blossomsequence-main">';

// Instructions
echo '<div class="blossomsequence-instructions">';
echo '<h3>'.get_string('instructions', 'blossomsequence').'</h3>';
echo '<p>'.get_string('instructiontext', 'blossomsequence').'</p>';
echo '</div>';

// Virtual smartphone display
echo '<div class="smartphone-container">';
echo '  <div class="smartphone-frame">';
echo '    <div class="smartphone-screen">';
echo '      <div id="blossom-canvas-container">';
echo '        <canvas id="blossom-canvas" width="320" height="568"></canvas>';
echo '      </div>';
echo '      <div class="sequence-info">';
echo '        <h4>'.get_string('sequencetype', 'blossomsequence').': '.get_string($blossomsequence->sequencetype, 'blossomsequence').'</h4>';
echo '        <p>'.get_string('difficulty', 'blossomsequence').': '.$blossomsequence->difficulty.'/5</p>';
echo '      </div>';
echo '      <div id="answer-input">';
echo '        <label>'.get_string('youranswer', 'blossomsequence').'</label>';
echo '        <input type="text" id="student-answer" placeholder="'.get_string('enteranswer', 'blossomsequence').'">';
echo '        <button id="submit-answer" class="btn btn-primary">'.get_string('submit', 'blossomsequence').'</button>';
echo '      </div>';
echo '      <div id="feedback-area"></div>';
echo '    </div>';
echo '  </div>';
echo '</div>';

echo '</div>'; // End main

// Sidebar with attempt history
if (!empty($attempts)) {
    echo '<div class="blossomsequence-sidebar">';
    echo '<h3>'.get_string('attempthistory', 'blossomsequence').'</h3>';
    echo '<div class="attempt-list">';
    foreach ($attempts as $attempt) {
        $completed = $attempt->completed ? 'completed' : 'incomplete';
        echo '<div class="attempt-item '.$completed.'">';
        echo '  <strong>'.get_string('attempt', 'blossomsequence').' #'.$attempt->attempt.'</strong><br>';
        echo '  '.get_string('score', 'blossomsequence').': '.number_format($attempt->score, 1).'%<br>';
        echo '  '.userdate($attempt->timecreated);
        echo '</div>';
    }
    echo '</div>';
    echo '</div>';
}

echo '</div>'; // End container

// Pass data to JavaScript
$jsData = array(
    'sequence' => $sequence,
    'petalcount' => $blossomsequence->petalcount,
    'sequencetype' => $blossomsequence->sequencetype,
    'cmid' => $cm->id,
    'userid' => $USER->id,
    'blossomsequenceid' => $blossomsequence->id
);

echo '<script type="text/javascript">';
echo 'var BLOSSOM_DATA = '.json_encode($jsData).';';
echo '</script>';

// Include the JavaScript
$PAGE->requires->js(new moodle_url('/mod/blossomsequence/amd/src/blossomsequence.js'));

// Finish the page
echo $OUTPUT->footer();
