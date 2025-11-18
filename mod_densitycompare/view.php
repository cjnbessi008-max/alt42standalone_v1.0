<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once('lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

if (!$cm = get_coursemodule_from_id('densitycompare', $id)) {
    print_error('invalidcoursemodule');
}

if (!$course = $DB->get_record('course', array('id' => $cm->course))) {
    print_error('coursemisconf');
}

if (!$densitycompare = $DB->get_record('densitycompare', array('id' => $cm->instance))) {
    print_error('invalidcoursemodule');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/densitycompare:view', $context);

// Handle AJAX requests
if (optional_param('ajax', 0, PARAM_INT)) {
    $action = required_param('action', PARAM_ALPHA);

    if ($action === 'get_problem') {
        $problem = densitycompare_get_random_problem($densitycompare->id);
        header('Content-Type: application/json');
        echo json_encode($problem);
        die();
    }

    if ($action === 'submit_answer') {
        require_capability('mod/densitycompare:submit', $context);

        $problemid = required_param('problem_id', PARAM_INT);
        $answer = required_param('answer', PARAM_TEXT);
        $timespent = required_param('time_spent', PARAM_INT);

        $attempt = densitycompare_submit_attempt($problemid, $USER->id, $answer, $timespent);

        header('Content-Type: application/json');
        echo json_encode(array(
            'success' => true,
            'is_correct' => $attempt->is_correct,
            'message' => $attempt->is_correct ?
                        get_string('correct', 'densitycompare') :
                        get_string('incorrect', 'densitycompare')
        ));
        die();
    }
}

// Log the view
$event = \mod_densitycompare\event\course_module_viewed::create(array(
    'objectid' => $densitycompare->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('densitycompare', $densitycompare);
$event->trigger();

// Setup page
$PAGE->set_url('/mod/densitycompare/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($densitycompare->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add CSS and JavaScript
$PAGE->requires->css('/mod/densitycompare/styles.css');
$PAGE->requires->js('/mod/densitycompare/js/densitycompare.js', true);

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($densitycompare->name));

// Display intro
if ($densitycompare->intro) {
    echo $OUTPUT->box(format_module_intro('densitycompare', $densitycompare, $cm->id),
                     'generalbox', 'intro');
}
?>

<div class="densitycompare-container">
    <div class="main-content">
        <div class="instructions">
            <h3><?php echo get_string('instruction', 'densitycompare'); ?></h3>
        </div>

        <div class="problem-display">
            <div id="question-text" class="question-text"></div>
        </div>

        <div class="answer-section">
            <button class="answer-btn" data-answer="larger">
                <?php echo get_string('answer_larger', 'densitycompare'); ?>
            </button>
            <button class="answer-btn" data-answer="smaller">
                <?php echo get_string('answer_smaller', 'densitycompare'); ?>
            </button>
            <button class="answer-btn" data-answer="equal">
                <?php echo get_string('answer_equal', 'densitycompare'); ?>
            </button>
        </div>

        <div id="feedback" class="feedback"></div>
        <button id="next-problem" class="next-btn" style="display:none;">
            <?php echo get_string('next', 'moodle'); ?>
        </button>
    </div>

    <!-- Smartphone Simulator -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <canvas id="density-canvas" width="300" height="500"></canvas>
            </div>
            <div class="smartphone-button"></div>
        </div>
    </div>
</div>

<script>
// Initialize the app with activity ID
window.densityCompareConfig = {
    activityId: <?php echo $densitycompare->id; ?>,
    cmId: <?php echo $cm->id; ?>,
    ajaxUrl: '<?php echo $CFG->wwwroot; ?>/mod/densitycompare/view.php'
};
</script>

<?php
echo $OUTPUT->footer();
