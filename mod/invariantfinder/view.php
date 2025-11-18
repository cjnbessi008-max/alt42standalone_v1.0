<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Prints a particular instance of invariantfinder
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // invariantfinder instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('invariantfinder', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $invariantfinder  = $DB->get_record('invariantfinder', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $invariantfinder  = $DB->get_record('invariantfinder', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $invariantfinder->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('invariantfinder', $invariantfinder->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Trigger course_module_viewed event
$event = \mod_invariantfinder\event\course_module_viewed::create(array(
    'objectid' => $invariantfinder->id,
    'context' => $context
));
$event->add_record_snapshot('course_modules', $cm);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('invariantfinder', $invariantfinder);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/invariantfinder/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($invariantfinder->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get or create user's attempt
$attempt = invariantfinder_get_user_attempt($invariantfinder->id, $USER->id);
if (!$attempt) {
    $attempt = new stdClass();
    $attempt->invariantfinder = $invariantfinder->id;
    $attempt->userid = $USER->id;
    $attempt->attempt_number = 1;
    $attempt->invariants_found = json_encode(array());
    $attempt->scale_actions = 0;
    $attempt->time_spent = 0;
    $attempt->completed = 0;
    $attempt->score = 0;
    $attempt->timecreated = time();
    $attempt->timemodified = time();
    $attempt->id = $DB->insert_record('invariantfinder_attempts', $attempt);
}

// Output starts here
echo $OUTPUT->header();

// Display the intro if present
if (trim(strip_tags($invariantfinder->intro))) {
    echo $OUTPUT->box_start('mod_introbox', 'invariantfinderintro');
    echo format_module_intro('invariantfinder', $invariantfinder, $cm->id);
    echo $OUTPUT->box_end();
}

// Include CSS and JavaScript
echo '<link rel="stylesheet" type="text/css" href="styles.css">';
echo '<script src="invariantfinder.js"></script>';

// Main content area
?>

<div class="invariantfinder-container">
    <div class="left-panel">
        <div class="instructions">
            <h3><?php echo get_string('instructions', 'invariantfinder'); ?></h3>
            <p><?php echo get_string('instructions_text', 'invariantfinder'); ?></p>

            <div class="controls">
                <h4><?php echo get_string('controls', 'invariantfinder'); ?></h4>
                <button id="zoom-in" class="control-btn">🔍+ <?php echo get_string('zoomin', 'invariantfinder'); ?></button>
                <button id="zoom-out" class="control-btn">🔍- <?php echo get_string('zoomout', 'invariantfinder'); ?></button>
                <button id="reset" class="control-btn">🔄 <?php echo get_string('reset', 'invariantfinder'); ?></button>
            </div>

            <div class="invariants-list">
                <h4><?php echo get_string('invariantsfound', 'invariantfinder'); ?></h4>
                <div id="found-invariants"></div>
            </div>

            <?php if ($invariantfinder->show_hints): ?>
            <div class="hints">
                <h4><?php echo get_string('hints', 'invariantfinder'); ?></h4>
                <div id="hints-content"></div>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="right-panel">
        <!-- Smartphone viewport -->
        <div class="smartphone-frame">
            <div class="smartphone-header">
                <div class="speaker"></div>
                <div class="camera"></div>
            </div>
            <div class="smartphone-screen">
                <div class="app-header">
                    <h2><?php echo get_string('appname', 'invariantfinder'); ?></h2>
                    <div class="score-display">
                        <?php echo get_string('score', 'invariantfinder'); ?>: <span id="current-score"><?php echo round($attempt->score); ?></span>/100
                    </div>
                </div>
                <canvas id="shape-canvas" width="300" height="500"></canvas>
                <div class="shape-controls">
                    <input type="range" id="scale-slider" min="50" max="200" value="100" class="slider">
                    <div class="slider-label"><?php echo get_string('scale', 'invariantfinder'); ?>: <span id="scale-value">100%</span></div>
                </div>
                <div class="measurement-display">
                    <div id="measurements"></div>
                </div>
                <div class="action-buttons">
                    <button id="check-invariant" class="btn-primary"><?php echo get_string('checkinvariant', 'invariantfinder'); ?></button>
                    <button id="submit-answer" class="btn-success"><?php echo get_string('submit', 'invariantfinder'); ?></button>
                </div>
            </div>
            <div class="smartphone-footer">
                <div class="home-button"></div>
            </div>
        </div>
    </div>
</div>

<script>
// Initialize the app with configuration
var invariantFinderConfig = {
    attemptId: <?php echo $attempt->id; ?>,
    shapeType: '<?php echo $invariantfinder->shape_type; ?>',
    difficulty: <?php echo $invariantfinder->difficulty; ?>,
    showHints: <?php echo $invariantfinder->show_hints ? 'true' : 'false'; ?>,
    wwwroot: '<?php echo $CFG->wwwroot; ?>',
    sesskey: '<?php echo sesskey(); ?>'
};

// Start the application
document.addEventListener('DOMContentLoaded', function() {
    InvariantFinder.init(invariantFinderConfig);
});
</script>

<?php

// Finish the page
echo $OUTPUT->footer();
