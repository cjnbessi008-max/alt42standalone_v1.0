<?php
/**
 * Student attempt page
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$cmid = required_param('cmid', PARAM_INT);
$problemid = required_param('problemid', PARAM_INT);

$cm = get_coursemodule_from_id('coreconditions', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$coreconditions = $DB->get_record('coreconditions', array('id' => $cm->instance), '*', MUST_EXIST);
$problem = $DB->get_record('coreconditions_problems', array('id' => $problemid), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/coreconditions:submit', $context);

$PAGE->set_url('/mod/coreconditions/attempt.php', array('cmid' => $cmid, 'problemid' => $problemid));
$PAGE->set_title(format_string($problem->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get conditions
$conditions = $DB->get_records('coreconditions_conditions',
    array('problem_id' => $problemid), 'condition_order ASC');

if (count($conditions) != 3) {
    print_error('error_conditioncount', 'coreconditions');
}

// Get previous attempts
$attempts = $DB->get_records('coreconditions_attempts',
    array('problem_id' => $problemid, 'userid' => $USER->id),
    'timecreated DESC');

// Handle form submission
$submittedfeedback = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $answer = required_param('answer', PARAM_TEXT);
    $starttime = required_param('starttime', PARAM_INT);
    $timetaken = time() - $starttime;

    // Evaluate the attempt
    $evaluation = \mod_coreconditions\condition_manager::evaluate_attempt(
        $problemid, $answer, $problem->correct_answer);

    // Save the attempt
    $attempt = new stdClass();
    $attempt->problem_id = $problemid;
    $attempt->userid = $USER->id;
    $attempt->attempt_number = count($attempts) + 1;
    $attempt->answer = $answer;
    $attempt->is_correct = $evaluation['all_met'] ? 1 : 0;
    $attempt->conditions_met = json_encode($evaluation['conditions_met']);
    $attempt->partial_score = $evaluation['score'];
    $attempt->time_taken = $timetaken;
    $attempt->timecreated = time();

    $DB->insert_record('coreconditions_attempts', $attempt);

    // Update grades
    coreconditions_update_grades($coreconditions, $USER->id);

    $submittedfeedback = $evaluation;

    // Refresh attempts list
    $attempts = $DB->get_records('coreconditions_attempts',
        array('problem_id' => $problemid, 'userid' => $USER->id),
        'timecreated DESC');
}

echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($problem->name));

// Display problem description
if ($problem->description) {
    echo $OUTPUT->box(format_text($problem->description), 'generalbox');
}

// Display conditions
echo '<div class="card mb-4">';
echo '<div class="card-header"><h4>' . get_string('coreconditions', 'coreconditions') . '</h4></div>';
echo '<div class="card-body"><ul class="list-group">';
foreach ($conditions as $condition) {
    echo '<li class="list-group-item">';
    echo '<strong>' . format_string($condition->condition_name) . '</strong>';
    echo ' (' . format_string($condition->condition_type) . ')';
    echo '<br><small>' . format_text($condition->condition_description) . '</small>';
    echo '</li>';
}
echo '</ul></div></div>';

// Display feedback from last submission
if ($submittedfeedback) {
    if ($submittedfeedback['all_met']) {
        echo '<div class="alert alert-success">';
        echo '<h4>Correct!</h4>';
        echo '<p>Score: ' . number_format($submittedfeedback['score'], 2) . '%</p>';
        echo '<p>All core conditions were met!</p>';
        echo '</div>';
    } else {
        echo '<div class="alert alert-warning">';
        echo '<h4>Partially Correct</h4>';
        echo '<p>Score: ' . number_format($submittedfeedback['score'], 2) . '%</p>';
        echo '<p>' . count($submittedfeedback['conditions_met']) . '/3 conditions met</p>';
        if ($submittedfeedback['feedback']) {
            echo '<hr>';
            echo '<strong>Feedback:</strong><br>';
            echo nl2br(htmlspecialchars($submittedfeedback['feedback']));
        }
        echo '</div>';
    }
}

// Display answer form
echo '<div class="card mb-4">';
echo '<div class="card-header"><h4>' . get_string('youranswer', 'coreconditions') . '</h4></div>';
echo '<div class="card-body">';
?>
<form method="post" action="" id="attempt-form">
    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
    <input type="hidden" name="starttime" value="<?php echo time(); ?>" id="starttime">

    <div class="form-group">
        <label for="answer"><?php echo get_string('youranswer', 'coreconditions'); ?></label>
        <input type="text" name="answer" id="answer" class="form-control form-control-lg"
               placeholder="Enter your answer..." required autofocus>
    </div>

    <button type="submit" class="btn btn-primary btn-lg">
        <?php echo get_string('submit', 'coreconditions'); ?>
    </button>
</form>

<script>
// Track time when page loads
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('starttime').value = Math.floor(Date.now() / 1000);
});
</script>

<?php
echo '</div></div>';

// Display previous attempts
if (!empty($attempts)) {
    echo '<div class="card">';
    echo '<div class="card-header"><h4>' . get_string('attempts', 'coreconditions') . '</h4></div>';
    echo '<div class="card-body">';
    echo '<table class="table table-striped">';
    echo '<thead><tr>';
    echo '<th>#</th>';
    echo '<th>Answer</th>';
    echo '<th>Score</th>';
    echo '<th>Conditions Met</th>';
    echo '<th>Time</th>';
    echo '<th>Date</th>';
    echo '</tr></thead><tbody>';

    foreach ($attempts as $attempt) {
        $conditionsmet = json_decode($attempt->conditions_met);
        echo '<tr>';
        echo '<td>' . $attempt->attempt_number . '</td>';
        echo '<td>' . htmlspecialchars($attempt->answer) . '</td>';
        echo '<td>' . number_format($attempt->partial_score, 2) . '%</td>';
        echo '<td>' . count($conditionsmet) . '/3</td>';
        echo '<td>' . $attempt->time_taken . 's</td>';
        echo '<td>' . userdate($attempt->timecreated) . '</td>';
        echo '</tr>';
    }

    echo '</tbody></table>';
    echo '</div></div>';
}

echo '<p class="mt-3"><a href="' . new moodle_url('/mod/coreconditions/view.php', array('id' => $cmid)) . '" class="btn btn-secondary">Back to Activity</a></p>';

echo $OUTPUT->footer();
