<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Prints a particular instance of dualdance
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$d  = optional_param('d', 0, PARAM_INT);  // dualdance instance ID
$action = optional_param('action', '', PARAM_ALPHA);

if ($id) {
    $cm         = get_coursemodule_from_id('dualdance', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $dualdance  = $DB->get_record('dualdance', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($d) {
    $dualdance  = $DB->get_record('dualdance', array('id' => $d), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $dualdance->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('dualdance', $dualdance->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Handle AJAX requests
if ($action === 'generate_problem') {
    require_sesskey();
    $problem = dualdance_generate_problem($dualdance);
    header('Content-Type: application/json');
    echo json_encode($problem);
    die();
}

if ($action === 'submit_answer') {
    require_sesskey();
    $problemid = required_param('problemid', PARAM_INT);
    $answer = required_param('answer', PARAM_FLOAT);
    $time_spent = required_param('time_spent', PARAM_INT);
    $interaction_data = optional_param('interaction_data', '', PARAM_RAW);

    $attempt = dualdance_submit_answer($dualdance, $problemid, $USER->id, $answer, $time_spent, $interaction_data);
    header('Content-Type: application/json');
    echo json_encode($attempt);
    die();
}

if ($action === 'get_stats') {
    require_sesskey();
    $stats = $DB->get_record('dualdance_grades',
        array('dualdanceid' => $dualdance->id, 'userid' => $USER->id));
    header('Content-Type: application/json');
    echo json_encode($stats ? $stats : new stdClass());
    die();
}

// Trigger course_module_viewed event
$event = \mod_dualdance\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $dualdance);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/dualdance/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($dualdance->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output starts here
echo $OUTPUT->header();

// Conditions to show the intro
if ($dualdance->intro) {
    echo $OUTPUT->box(format_module_intro('dualdance', $dualdance, $cm->id), 'generalbox mod_introbox', 'dualdanceintro');
}

// Get user's current stats
$user_stats = $DB->get_record('dualdance_grades',
    array('dualdanceid' => $dualdance->id, 'userid' => $USER->id));

?>
<div id="dualdance-app" class="dualdance-container">
    <!-- Progress Stats -->
    <div class="dualdance-stats">
        <h3><?php echo get_string('your_progress', 'dualdance'); ?></h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('current_grade', 'dualdance'); ?>:</span>
                <span class="stat-value" id="current-grade"><?php echo $user_stats ? round($user_stats->grade, 1) : 0; ?>%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('attempts', 'dualdance'); ?>:</span>
                <span class="stat-value" id="attempts-count"><?php echo $user_stats ? $user_stats->attempts_count : 0; ?></span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><?php echo get_string('correct', 'dualdance'); ?>:</span>
                <span class="stat-value" id="correct-count"><?php echo $user_stats ? $user_stats->correct_count : 0; ?></span>
            </div>
        </div>
    </div>

    <!-- Virtual Smartphone Container -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <!-- Title Area -->
                <div class="app-header">
                    <h2><?php echo get_string('dual_dance', 'dualdance'); ?></h2>
                    <p class="subtitle"><?php echo get_string('exponential_log_functions', 'dualdance'); ?></p>
                </div>

                <!-- Visualization Canvas -->
                <div class="visualization-area">
                    <canvas id="dance-canvas" width="320" height="400"></canvas>
                    <div class="function-legend">
                        <div class="legend-item">
                            <span class="color-box exp-color"></span>
                            <span id="exp-function-label">f(x) = e^x</span>
                        </div>
                        <div class="legend-item">
                            <span class="color-box log-color"></span>
                            <span id="log-function-label">g(x) = ln(x)</span>
                        </div>
                    </div>
                </div>

                <!-- Problem Area -->
                <div class="problem-area">
                    <div id="problem-container">
                        <p id="problem-text"><?php echo get_string('click_start', 'dualdance'); ?></p>
                    </div>

                    <div class="answer-input">
                        <input type="number" id="answer-input" step="0.01" placeholder="<?php echo get_string('enter_answer', 'dualdance'); ?>" disabled>
                    </div>

                    <div class="button-group">
                        <button id="start-btn" class="btn btn-primary"><?php echo get_string('start', 'dualdance'); ?></button>
                        <button id="submit-btn" class="btn btn-success" disabled><?php echo get_string('submit', 'dualdance'); ?></button>
                        <button id="next-btn" class="btn btn-info" style="display:none;"><?php echo get_string('next_problem', 'dualdance'); ?></button>
                    </div>

                    <div id="feedback-area" class="feedback-area" style="display:none;">
                        <div id="feedback-message"></div>
                    </div>
                </div>

                <!-- Timer Display -->
                <div class="timer-display">
                    <span><?php echo get_string('time', 'dualdance'); ?>:</span>
                    <span id="timer">0:00</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Mobile Interaction Instructions -->
    <div class="instructions">
        <h4><?php echo get_string('instructions', 'dualdance'); ?></h4>
        <ul>
            <li><?php echo get_string('instruction_1', 'dualdance'); ?></li>
            <li><?php echo get_string('instruction_2', 'dualdance'); ?></li>
            <li><?php echo get_string('instruction_3', 'dualdance'); ?></li>
        </ul>
    </div>
</div>

<script>
// Pass configuration to JavaScript
var DualDanceConfig = {
    sesskey: '<?php echo sesskey(); ?>',
    cmid: <?php echo $cm->id; ?>,
    dualdanceid: <?php echo $dualdance->id; ?>,
    exp_base_min: <?php echo $dualdance->exp_base_min; ?>,
    exp_base_max: <?php echo $dualdance->exp_base_max; ?>,
    log_base_min: <?php echo $dualdance->log_base_min; ?>,
    log_base_max: <?php echo $dualdance->log_base_max; ?>,
    animation_speed: <?php echo $dualdance->animation_speed; ?>,
    wwwroot: '<?php echo $CFG->wwwroot; ?>',
    strings: {
        correct: '<?php echo get_string('correct', 'dualdance'); ?>',
        incorrect: '<?php echo get_string('incorrect', 'dualdance'); ?>',
        correct_answer: '<?php echo get_string('correct_answer', 'dualdance'); ?>',
        try_again: '<?php echo get_string('try_again', 'dualdance'); ?>',
        loading: '<?php echo get_string('loading', 'dualdance'); ?>'
    }
};
</script>

<?php
// Load required JavaScript and CSS
$PAGE->requires->css('/mod/dualdance/styles.css');
$PAGE->requires->js('/mod/dualdance/js/dualdance.js', true);

echo $OUTPUT->footer();
