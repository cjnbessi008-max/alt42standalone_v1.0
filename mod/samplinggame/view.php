<?php
// This file is part of Moodle - http://moodle.org/

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course module ID
$s = optional_param('s', 0, PARAM_INT);  // Samplinggame instance ID

if ($id) {
    $cm = get_coursemodule_from_id('samplinggame', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $samplinggame = $DB->get_record('samplinggame', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($s) {
    $samplinggame = $DB->get_record('samplinggame', array('id' => $s), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $samplinggame->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('samplinggame', $samplinggame->id, $course->id, false, MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/samplinggame:view', $context);

// Trigger module viewed event
$event = \mod_samplinggame\event\course_module_viewed::create(array(
    'objectid' => $samplinggame->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('samplinggame', $samplinggame);
$event->trigger();

// Mark viewed
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

$PAGE->set_url('/mod/samplinggame/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($samplinggame->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Load JavaScript and CSS
$PAGE->requires->css('/mod/samplinggame/css/styles.css');
$PAGE->requires->js('/mod/samplinggame/js/samplinggame.js', true);

// Pass data to JavaScript
$jsdata = array(
    'samplinggameid' => $samplinggame->id,
    'populationsize' => $samplinggame->population_size,
    'samplesize' => $samplinggame->sample_size,
    'samplingmethod' => $samplinggame->sampling_method,
    'gamescenario' => $samplinggame->game_scenario,
    'timelimit' => $samplinggame->time_limit,
    'userid' => $USER->id,
    'sesskey' => sesskey(),
    'wwwroot' => $CFG->wwwroot
);
$PAGE->requires->js_init_call('initSamplingGame', array($jsdata));

echo $OUTPUT->header();

// Display intro
echo $OUTPUT->box_start('generalbox boxaligncenter', 'intro');
echo format_module_intro('samplinggame', $samplinggame, $cm->id);
echo $OUTPUT->box_end();

// Get user's previous attempts
$attempts = samplinggame_get_user_attempts($samplinggame->id, $USER->id);
if (!empty($attempts)) {
    echo '<div class="previous-attempts">';
    echo '<h3>' . get_string('yourattempts', 'mod_samplinggame') . '</h3>';
    echo '<table class="generaltable">';
    echo '<thead><tr>';
    echo '<th>' . get_string('attemptnumber', 'mod_samplinggame') . '</th>';
    echo '<th>' . get_string('score', 'mod_samplinggame') . '</th>';
    echo '<th>' . get_string('timespent', 'mod_samplinggame') . '</th>';
    echo '<th>' . get_string('date', 'mod_samplinggame') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';

    foreach ($attempts as $attempt) {
        echo '<tr>';
        echo '<td>' . $attempt->attempt_number . '</td>';
        echo '<td>' . number_format($attempt->score, 2) . ' / ' . $samplinggame->grade . '</td>';
        echo '<td>' . format_time($attempt->time_spent) . '</td>';
        echo '<td>' . userdate($attempt->timecreated) . '</td>';
        echo '</tr>';
    }

    echo '</tbody>';
    echo '</table>';
    echo '</div>';
}

// Main game container
echo '<div class="samplinggame-container">';
echo '<div class="smartphone-frame">';
echo '<div class="smartphone-screen">';
echo '<div id="game-area">';
echo '<div id="game-instructions"></div>';
echo '<div id="game-canvas"></div>';
echo '<div id="game-controls">';
echo '<button id="start-game-btn" class="btn btn-primary">' . get_string('startgame', 'mod_samplinggame') . '</button>';
echo '<button id="reset-game-btn" class="btn btn-secondary" style="display:none;">' . get_string('reset', 'mod_samplinggame') . '</button>';
echo '<button id="submit-game-btn" class="btn btn-success" style="display:none;">' . get_string('submit', 'mod_samplinggame') . '</button>';
echo '</div>';
echo '<div id="game-feedback"></div>';
echo '<div id="timer-display"></div>';
echo '</div>';
echo '</div>';
echo '</div>';
echo '</div>';

echo $OUTPUT->footer();
