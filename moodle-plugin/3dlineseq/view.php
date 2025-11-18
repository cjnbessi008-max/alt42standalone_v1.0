<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once($CFG->dirroot.'/mod/3dlineseq/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

if (!$cm = get_coursemodule_from_id('3dlineseq', $id)) {
    print_error('invalidcoursemodule');
}

if (!$course = $DB->get_record('course', array('id' => $cm->course))) {
    print_error('coursemisconf');
}

if (!$lineseq = $DB->get_record('3dlineseq', array('id' => $cm->instance))) {
    print_error('invalidid', '3dlineseq');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/3dlineseq:view', $context);

// Log view
$params = array(
    'context' => $context,
    'objectid' => $lineseq->id
);
$event = \mod_3dlineseq\event\course_module_viewed::create($params);
$event->add_record_snapshot('course_modules', $cm);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('3dlineseq', $lineseq);
$event->trigger();

// Mark as viewed
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Set up the page
$PAGE->set_url('/mod/3dlineseq/view.php', array('id' => $cm->id));
$PAGE->set_title($course->shortname.': '.$lineseq->name);
$PAGE->set_heading($course->fullname);
$PAGE->set_context($context);

// Get sequence data
$sequencedata = lineseq_get_sequence_data($lineseq->id);

// Include JavaScript and CSS
$PAGE->requires->js('/mod/3dlineseq/webapp/lib/three.min.js');
$PAGE->requires->js('/mod/3dlineseq/webapp/js/3dlineseq.js');
$PAGE->requires->css('/mod/3dlineseq/webapp/css/style.css');

// Pass data to JavaScript
$PAGE->requires->js_init_call('init3DLineSeq', array($sequencedata), true);

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading($lineseq->name);

// Display intro
echo $OUTPUT->box_start('generalbox boxaligncenter', 'intro');
echo format_module_intro('3dlineseq', $lineseq, $cm->id);
echo $OUTPUT->box_end();

// Main content
?>
<div class="3dlineseq-container">
    <div class="main-content">
        <div id="sequence-info" class="sequence-info">
            <h3><?php echo get_string('sequencetype', '3dlineseq'); ?>:
                <?php echo get_string($sequencedata['type'], '3dlineseq'); ?></h3>
            <p><strong><?php echo get_string('sequencedata', '3dlineseq'); ?>:</strong>
                <?php echo implode(', ', $sequencedata['values']); ?></p>
        </div>

        <div id="controls" class="controls">
            <button id="reset-view" class="btn btn-secondary">
                <?php echo get_string('resetview', '3dlineseq'); ?>
            </button>
            <button id="toggle-rotation" class="btn btn-primary">
                <?php echo get_string('rotate', '3dlineseq'); ?>
            </button>
        </div>
    </div>

    <!-- Smartphone display (bottom right) -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen" id="smartphone-canvas-container">
                <!-- 3D canvas will be inserted here -->
            </div>
        </div>
    </div>
</div>

<style>
.3dlineseq-container {
    position: relative;
    width: 100%;
    min-height: 600px;
}

.main-content {
    width: calc(100% - 320px);
    float: left;
}

.smartphone-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.smartphone-frame {
    width: 280px;
    height: 560px;
    background: #1a1a1a;
    border-radius: 30px;
    padding: 15px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    border: 3px solid #333;
}

.smartphone-screen {
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
}

.sequence-info {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
}

.controls {
    margin: 20px 0;
}

.controls button {
    margin-right: 10px;
    padding: 10px 20px;
}

@media (max-width: 768px) {
    .main-content {
        width: 100%;
        float: none;
    }

    .smartphone-container {
        position: relative;
        bottom: auto;
        right: auto;
        margin: 20px auto;
        display: block;
        width: fit-content;
    }
}
</style>

<?php
echo $OUTPUT->footer();
