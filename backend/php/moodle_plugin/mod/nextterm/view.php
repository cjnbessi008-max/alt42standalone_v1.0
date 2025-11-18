<?php
/**
 * Next Term Vision - Moodle Activity Module
 * View page
 *
 * @package    mod_nextterm
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID

if ($id) {
    $cm = get_coursemodule_from_id('nextterm', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $nextterm = $DB->get_record('nextterm', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    error('You must specify a course_module ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Log view
$event = \mod_nextterm\event\course_module_viewed::create(array(
    'objectid' => $nextterm->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('nextterm', $nextterm);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/nextterm/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($nextterm->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output starts here
echo $OUTPUT->header();

// Display module intro
echo $OUTPUT->heading($nextterm->name);

if ($nextterm->intro) {
    echo $OUTPUT->box(format_module_intro('nextterm', $nextterm, $cm->id), 'generalbox mod_introbox', 'nexttermintro');
}

// Embed the Next Term Vision app
$student_id = $USER->id;
$app_url = new moodle_url('/mod/nextterm/app/index.html', array('student_id' => $student_id));

echo '<div class="nextterm-container">';
echo '<iframe src="' . $app_url . '"
             width="100%"
             height="900px"
             frameborder="0"
             style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      </iframe>';
echo '</div>';

// Display student progress summary
$progress = $DB->get_record('nextterm_progress', array('student_id' => $USER->id));

if ($progress) {
    $accuracy = $progress->total_problems > 0
        ? round(($progress->correct_answers / $progress->total_problems) * 100, 1)
        : 0;

    echo '<div class="nextterm-summary">';
    echo '<h3>' . get_string('yourprogress', 'mod_nextterm') . '</h3>';
    echo '<div class="progress-stats">';
    echo '<div class="stat-item">';
    echo '<span class="stat-label">' . get_string('currentlevel', 'mod_nextterm') . ':</span>';
    echo '<span class="stat-value">' . $progress->current_level . '</span>';
    echo '</div>';
    echo '<div class="stat-item">';
    echo '<span class="stat-label">' . get_string('totalproblems', 'mod_nextterm') . ':</span>';
    echo '<span class="stat-value">' . $progress->total_problems . '</span>';
    echo '</div>';
    echo '<div class="stat-item">';
    echo '<span class="stat-label">' . get_string('correctanswers', 'mod_nextterm') . ':</span>';
    echo '<span class="stat-value">' . $progress->correct_answers . '</span>';
    echo '</div>';
    echo '<div class="stat-item">';
    echo '<span class="stat-label">' . get_string('accuracy', 'mod_nextterm') . ':</span>';
    echo '<span class="stat-value">' . $accuracy . '%</span>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
}

// Finish the page
echo $OUTPUT->footer();
