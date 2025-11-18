<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');
require_once(dirname(__FILE__).'/locallib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // smoothsteps instance ID

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

// Print the page header
$PAGE->set_url('/mod/smoothsteps/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($smoothsteps->name));
$PAGE->set_heading(format_string($course->fullname));

// Include enhanced JavaScript and CSS
$PAGE->requires->css('/mod/smoothsteps/styles.css');
$PAGE->requires->css('/mod/smoothsteps/enhanced_styles.css');
$PAGE->requires->js('/mod/smoothsteps/enhanced_animation.js', true);

// Include Hammer.js for mobile gesture support
$PAGE->requires->js('https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js', true);

// Pass configuration to JavaScript
$config = array(
    'distributiontype' => $smoothsteps->distributiontype,
    'animationspeed' => $smoothsteps->animationspeed,
    'cmid' => $cm->id,
    'sesskey' => sesskey()
);
$PAGE->requires->js_init_call('initSmoothStepsAnimation', array($config), false);

// Get user statistics
$userstats = smoothsteps_get_user_stats($smoothsteps->id, $USER->id);

// Output starts here
echo $OUTPUT->header();

// Show intro if available
if ($smoothsteps->intro) {
    echo $OUTPUT->box(format_module_intro('smoothsteps', $smoothsteps, $cm->id), 'generalbox mod_introbox', 'smoothstepsintro');
}

?>

<div class="smoothsteps-main-container">
    <div class="left-panel">
        <!-- User Statistics -->
        <div class="stats-panel">
            <h3><?php echo get_string('yourprogress', 'smoothsteps'); ?></h3>
            <div id="userStats">
                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-label"><?php echo get_string('attempts', 'smoothsteps'); ?>:</span>
                        <span class="stat-value"><?php echo $userstats->total_attempts; ?></span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label"><?php echo get_string('correct', 'smoothsteps'); ?>:</span>
                        <span class="stat-value"><?php echo $userstats->correct_answers; ?></span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label"><?php echo get_string('accuracy', 'smoothsteps'); ?>:</span>
                        <span class="stat-value"><?php echo round($userstats->accuracy, 1); ?>%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quiz Panel -->
        <div class="quiz-panel-container">
            <h3><?php echo get_string('questionheader', 'smoothsteps'); ?></h3>
            <button id="loadQuizBtn" class="btn btn-primary">
                <?php echo get_string('loadquiz', 'smoothsteps'); ?>
            </button>
            <div id="quizPanel" class="quiz-content">
                <p class="quiz-instruction"><?php echo get_string('selectanswer', 'smoothsteps'); ?></p>
            </div>
        </div>

        <!-- Explanation Panel -->
        <div class="explanation-panel">
            <?php if ($smoothsteps->distributiontype === 'both' || $smoothsteps->distributiontype === 'continuous'): ?>
            <div id="continuousExplanation" class="explanation-box continuous-box">
                <h4><?php echo get_string('continuous', 'smoothsteps'); ?></h4>
                <p><?php echo get_string('continuousexplanation', 'smoothsteps'); ?></p>
            </div>
            <?php endif; ?>

            <?php if ($smoothsteps->distributiontype === 'both' || $smoothsteps->distributiontype === 'discrete'): ?>
            <div id="discreteExplanation" class="explanation-box discrete-box">
                <h4><?php echo get_string('discrete', 'smoothsteps'); ?></h4>
                <p><?php echo get_string('discreteexplanation', 'smoothsteps'); ?></p>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Smartphone Frame - Fixed at bottom right -->
    <div class="smartphone-frame">
        <div class="smartphone-screen">
            <div class="animation-controls">
                <h3><?php echo get_string('smoothvssteps', 'smoothsteps'); ?></h3>
                <div class="control-buttons">
                    <button id="playBtn" class="btn btn-primary">
                        <?php echo get_string('play', 'smoothsteps'); ?>
                    </button>
                    <button id="pauseBtn" class="btn btn-secondary">
                        <?php echo get_string('pause', 'smoothsteps'); ?>
                    </button>
                    <button id="resetBtn" class="btn btn-warning">
                        <?php echo get_string('reset', 'smoothsteps'); ?>
                    </button>
                </div>
            </div>
            <canvas id="probabilityCanvas" width="360" height="640"></canvas>
        </div>
    </div>
</div>

<style>
/* Layout for main container */
.smoothsteps-main-container {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 20px;
    position: relative;
    min-height: 700px;
}

.left-panel {
    flex: 1;
    max-width: 600px;
}

/* Stats Panel */
.stats-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stats-panel h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
}

.stats-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.stat-item {
    flex: 1;
    min-width: 100px;
    background: rgba(255, 255, 255, 0.2);
    padding: 12px;
    border-radius: 8px;
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 12px;
    opacity: 0.9;
    margin-bottom: 5px;
}

.stat-value {
    display: block;
    font-size: 24px;
    font-weight: bold;
}

/* Quiz Panel */
.quiz-panel-container {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quiz-panel-container h3 {
    margin: 0 0 15px 0;
    color: #333;
}

#loadQuizBtn {
    width: 100%;
    margin-bottom: 15px;
}

.quiz-content {
    min-height: 100px;
}

.problem-question {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    border-left: 4px solid #667eea;
}

.problem-options {
    margin: 15px 0;
}

.option-label {
    display: block;
    background: white;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid #e9ecef;
}

.option-label:hover {
    border-color: #667eea;
    background: #f8f9ff;
}

.option-radio {
    margin-right: 10px;
}

.feedback-message {
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-weight: bold;
    text-align: center;
}

.feedback-message.correct {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.feedback-message.incorrect {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

@media (max-width: 1200px) {
    .smoothsteps-main-container {
        flex-direction: column;
    }

    .left-panel {
        max-width: 100%;
    }

    .smartphone-frame {
        position: static !important;
        margin: 20px auto;
    }
}
</style>

<?php

// Finish the page
echo $OUTPUT->footer();
