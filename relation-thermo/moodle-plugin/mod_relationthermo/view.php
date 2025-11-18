<?php
/**
 * Relation Thermo Activity Module - Main View
 *
 * @package    mod_relationthermo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course module ID
$r  = optional_param('r', 0, PARAM_INT);  // Relation Thermo instance ID

if ($id) {
    $cm = get_coursemodule_from_id('relationthermo', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $relationthermo = $DB->get_record('relationthermo', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($r) {
    $relationthermo = $DB->get_record('relationthermo', array('id' => $r), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $relationthermo->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('relationthermo', $relationthermo->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Log view
$event = \mod_relationthermo\event\course_module_viewed::create(array(
    'objectid' => $relationthermo->id,
    'context' => $context,
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('relationthermo', $relationthermo);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/relationthermo/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($relationthermo->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add CSS and JS
$PAGE->requires->css('/mod/relationthermo/styles/app.css');
$PAGE->requires->js('/mod/relationthermo/scripts/app.js', true);

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading($relationthermo->name);

// Introduction
if ($relationthermo->intro) {
    echo $OUTPUT->box(format_module_intro('relationthermo', $relationthermo, $cm->id),
                     'generalbox', 'intro');
}

// Main app container
?>
<div id="relationthermo-app" class="relationthermo-container">
    <div class="smartphone-frame">
        <div class="smartphone-screen">
            <div id="app-content">
                <div class="loading">로딩중...</div>
            </div>
        </div>
    </div>
</div>

<script>
// Pass configuration to JavaScript
var RelationThermoConfig = {
    courseId: <?php echo $course->id; ?>,
    activityId: <?php echo $relationthermo->id; ?>,
    userId: <?php echo $USER->id; ?>,
    problemCount: <?php echo $relationthermo->problem_count; ?>,
    difficulty: <?php echo $relationthermo->difficulty; ?>,
    showThermometer: <?php echo $relationthermo->show_thermometer ? 'true' : 'false'; ?>,
    timeLimit: <?php echo $relationthermo->time_limit; ?>,
    apiEndpoint: '<?php echo $CFG->wwwroot; ?>/mod/relationthermo/api.php'
};
</script>

<?php
echo $OUTPUT->footer();
