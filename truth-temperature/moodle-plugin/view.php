<?php
// This file is part of Moodle - http://moodle.org/
//
// Truth Temperature Activity Module
// Main view page

require_once('../../config.php');
require_once('lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

if ($id) {
    $cm = get_coursemodule_from_id('truthtemp', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $truthtemp = $DB->get_record('truthtemp', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Log this view
$params = array(
    'context' => $context,
    'objectid' => $truthtemp->id
);
$event = \mod_truthtemp\event\course_module_viewed::create($params);
$event->add_record_snapshot('course_modules', $cm);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('truthtemp', $truthtemp);
$event->trigger();

// Set page parameters
$PAGE->set_url('/mod/truthtemp/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($truthtemp->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Include JavaScript for virtual smartphone
$PAGE->requires->js('/mod/truthtemp/javascript/smartphone.js');
$PAGE->requires->css('/mod/truthtemp/styles/smartphone.css');

echo $OUTPUT->header();

// Display activity description
echo $OUTPUT->heading($truthtemp->name);
echo $OUTPUT->box_start('generalbox boxaligncenter', 'intro');
echo format_module_intro('truthtemp', $truthtemp, $cm->id);
echo $OUTPUT->box_end();

// Get problems for this activity
$problems = $DB->get_records('truthtemp_problems', array('truthtemp_id' => $truthtemp->id));

?>

<div class="truthtemp-container">
    <div class="main-content">
        <h3>부등식 문제</h3>
        <div id="problem-display">
            <?php if (!empty($problems)): ?>
                <?php $first_problem = reset($problems); ?>
                <div class="problem-card" data-problem-id="<?php echo $first_problem->id; ?>">
                    <p class="question-text"><?php echo $first_problem->question_text; ?></p>
                    <p class="inequality-expression"><?php echo $first_problem->inequality_expression; ?></p>

                    <div class="answer-buttons">
                        <button class="btn btn-success answer-btn" data-answer="true">
                            참 (True)
                        </button>
                        <button class="btn btn-danger answer-btn" data-answer="false">
                            거짓 (False)
                        </button>
                    </div>
                </div>
            <?php else: ?>
                <p>문제가 아직 없습니다.</p>
            <?php endif; ?>
        </div>

        <div id="result-message" class="alert" style="display: none;"></div>
    </div>

    <!-- Virtual Smartphone Display (Bottom Right) -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <div class="smartphone-header">
                    <span class="app-title">Truth Temperature</span>
                </div>
                <div class="smartphone-content">
                    <div class="temperature-display">
                        <div class="thermometer">
                            <div class="thermometer-fill" id="thermometer-fill"></div>
                        </div>
                        <div class="temperature-value" id="temperature-value">
                            <span class="temp-number">--</span>°C
                        </div>
                        <div class="temperature-status" id="temperature-status">
                            대기 중...
                        </div>
                    </div>
                </div>
            </div>
            <div class="smartphone-button"></div>
        </div>
    </div>
</div>

<script>
// Pass PHP data to JavaScript
var cmid = <?php echo $cm->id; ?>;
var userid = <?php echo $USER->id; ?>;
var problems = <?php echo json_encode(array_values($problems)); ?>;
</script>

<?php
echo $OUTPUT->footer();
?>
