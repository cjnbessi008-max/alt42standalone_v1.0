<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID, or
$n  = optional_param('n', 0, PARAM_INT);  // ... smoothsteps instance ID - it should be named as the first character of the module.

if ($id) {
    $cm         = get_coursemodule_from_id('smoothsteps', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $smoothsteps  = $DB->get_record('smoothsteps', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $smoothsteps  = $DB->get_record('smoothsteps', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $smoothsteps->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('smoothsteps', $smoothsteps->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$event = \mod_smoothsteps\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $smoothsteps);
$event->trigger();

// Print the page header.
$PAGE->set_url('/mod/smoothsteps/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($smoothsteps->name));
$PAGE->set_heading(format_string($course->fullname));

// Include JavaScript and CSS
$PAGE->requires->css('/mod/smoothsteps/styles.css');
$PAGE->requires->js('/mod/smoothsteps/animation.js', true);

// Pass configuration to JavaScript
$config = array(
    'distributiontype' => $smoothsteps->distributiontype,
    'animationspeed' => $smoothsteps->animationspeed,
);
$PAGE->requires->js_init_call('initSmoothStepsAnimation', array($config), false);

// Output starts here.
echo $OUTPUT->header();

// Conditions to show the intro can change to look for own settings or whatever.
if ($smoothsteps->intro) {
    echo $OUTPUT->box(format_module_intro('smoothsteps', $smoothsteps, $cm->id), 'generalbox mod_introbox', 'smoothstepsintro');
}

?>

<div class="smoothsteps-container">
    <div class="smartphone-frame">
        <div class="smartphone-screen">
            <div class="animation-controls">
                <h3><?php echo get_string('smoothvssteps', 'smoothsteps'); ?></h3>
                <div class="control-buttons">
                    <button id="playBtn" class="btn btn-primary"><?php echo get_string('play', 'smoothsteps'); ?></button>
                    <button id="pauseBtn" class="btn btn-secondary"><?php echo get_string('pause', 'smoothsteps'); ?></button>
                    <button id="resetBtn" class="btn btn-warning"><?php echo get_string('reset', 'smoothsteps'); ?></button>
                </div>
            </div>
            <canvas id="probabilityCanvas" width="360" height="640"></canvas>
            <div class="explanation-panel">
                <div id="continuousExplanation" class="explanation-box continuous-box">
                    <h4><?php echo get_string('continuous', 'smoothsteps'); ?></h4>
                    <p><?php echo get_string('continuousexplanation', 'smoothsteps'); ?></p>
                </div>
                <div id="discreteExplanation" class="explanation-box discrete-box">
                    <h4><?php echo get_string('discrete', 'smoothsteps'); ?></h4>
                    <p><?php echo get_string('discreteexplanation', 'smoothsteps'); ?></p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php

// Finish the page.
echo $OUTPUT->footer();
