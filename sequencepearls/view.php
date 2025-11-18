<?php
// This file is part of Moodle - http://moodle.org/
//
// Main view page for Sequence Pearls activity

require_once('../../config.php');
require_once('lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

if ($id) {
    $cm = get_coursemodule_from_id('sequencepearls', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $sequencepearls = $DB->get_record('sequencepearls', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Log the view
$event = \mod_sequencepearls\event\course_module_viewed::create(array(
    'objectid' => $sequencepearls->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('sequencepearls', $sequencepearls);
$event->trigger();

// Set up the page
$PAGE->set_url('/mod/sequencepearls/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($sequencepearls->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add JavaScript and CSS
$PAGE->requires->css('/mod/sequencepearls/styles.css');
$PAGE->requires->js_call_amd('mod_sequencepearls/pearls', 'init', array(
    'cmid' => $cm->id,
    'userid' => $USER->id,
    'activityid' => $sequencepearls->id
));

// Get user progress
$progress = $DB->get_record('sequencepearls_progress',
    array('sequencepearls_id' => $sequencepearls->id, 'userid' => $USER->id));

if (!$progress) {
    $progress = new stdClass();
    $progress->problems_attempted = 0;
    $progress->problems_correct = 0;
    $progress->current_streak = 0;
    $progress->best_streak = 0;
    $progress->completion_percentage = 0;
}

// Get next problem
$problem = sequencepearls_get_next_problem($sequencepearls->id, $USER->id);

// Output starts here
echo $OUTPUT->header();

echo $OUTPUT->heading($sequencepearls->name);

// Display intro
echo $OUTPUT->box_start('generalbox mod_introbox');
echo format_module_intro('sequencepearls', $sequencepearls, $cm->id);
echo $OUTPUT->box_end();

// Main interface
?>

<div class="sequencepearls-container">
    <!-- Progress panel -->
    <div class="progress-panel">
        <h3><?php echo get_string('progress', 'sequencepearls'); ?></h3>
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('problems_solved', 'sequencepearls',
                    array('correct' => $progress->problems_correct, 'total' => $sequencepearls->num_problems)); ?></span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('accuracy', 'sequencepearls',
                    round($progress->problems_attempted > 0 ?
                        ($progress->problems_correct / $progress->problems_attempted * 100) : 0, 1)); ?></span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('current_streak', 'sequencepearls',
                    $progress->current_streak); ?></span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('best_streak', 'sequencepearls',
                    $progress->best_streak); ?></span>
            </div>
        </div>
    </div>

    <!-- Virtual smartphone display -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <div class="smartphone-header">
                    <span class="smartphone-title"><?php echo get_string('smartphone_view', 'sequencepearls'); ?></span>
                    <button class="fullscreen-btn" id="fullscreen-toggle">⛶</button>
                </div>

                <div class="pearls-app" id="pearls-app">
                    <!-- Welcome message -->
                    <div class="welcome-section">
                        <h2><?php echo get_string('welcome_message', 'sequencepearls'); ?></h2>
                        <p><?php echo get_string('instructions', 'sequencepearls'); ?></p>
                    </div>

                    <!-- Pearls visualization canvas -->
                    <canvas id="pearls-canvas" width="360" height="400"></canvas>

                    <!-- Answer input section -->
                    <div class="answer-section">
                        <label for="user-answer"><?php echo get_string('your_answer', 'sequencepearls'); ?>:</label>
                        <input type="number" id="user-answer" class="answer-input" step="0.01">
                        <button id="submit-answer" class="btn-primary">
                            <?php echo get_string('submit_answer', 'sequencepearls'); ?>
                        </button>
                    </div>

                    <!-- Feedback section -->
                    <div id="feedback-section" class="feedback-section" style="display:none;">
                        <div id="feedback-message"></div>
                        <button id="next-problem" class="btn-secondary">
                            <?php echo get_string('next_problem', 'sequencepearls'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Hidden data for JavaScript -->
<div id="problem-data" style="display:none;"
     data-problemid="<?php echo $problem->id; ?>"
     data-sequence='<?php echo $problem->sequence_data; ?>'
     data-missing="<?php echo $problem->missing_position; ?>"
     data-activityid="<?php echo $sequencepearls->id; ?>"
     data-userid="<?php echo $USER->id; ?>"
     data-sesskey="<?php echo sesskey(); ?>">
</div>

<?php
echo $OUTPUT->footer();
