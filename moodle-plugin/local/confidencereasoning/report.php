<?php
// This file is part of Moodle - http://moodle.org/

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/tablelib.php');
require_once(__DIR__ . '/lib.php');

$quizid = required_param('quizid', PARAM_INT);
$userid = optional_param('userid', 0, PARAM_INT);

require_login();

$quiz = $DB->get_record('quiz', array('id' => $quizid), '*', MUST_EXIST);
$course = $DB->get_record('course', array('id' => $quiz->course), '*', MUST_EXIST);
$cm = get_coursemodule_from_instance('quiz', $quiz->id, $course->id, false, MUST_EXIST);

$context = context_module::instance($cm->id);
require_capability('local/confidencereasoning:view', $context);

$PAGE->set_url('/local/confidencereasoning/report.php', array('quizid' => $quizid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('confidencestats', 'local_confidencereasoning'));
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('confidencestats', 'local_confidencereasoning') . ': ' . $quiz->name);

// Show overall statistics
if ($userid > 0) {
    // Individual user report
    $user = $DB->get_record('user', array('id' => $userid), '*', MUST_EXIST);
    echo $OUTPUT->heading(fullname($user), 3);

    $stats = local_confidencereasoning_get_stats($userid, $quizid);
    $records = local_confidencereasoning_get_by_quiz($quizid, $userid);

    if ($stats) {
        echo '<div class="confidence-stats-box">';
        echo '<h3>' . get_string('avgconfidence', 'local_confidencereasoning') . '</h3>';
        echo '<div class="stat-item">';
        echo '<span class="stat-label">' . get_string('avgconfidence', 'local_confidencereasoning') . ':</span> ';
        echo '<span class="stat-value">' . $stats->avgconfidence . ' / 5</span>';
        echo '</div>';
        echo '<div class="stat-item">';
        echo '<span class="stat-label">' . get_string('correctwithhighconfidence', 'local_confidencereasoning') . ':</span> ';
        echo '<span class="stat-value">' . $stats->correctwithhighconfidence . '</span>';
        echo '</div>';
        echo '<div class="stat-item">';
        echo '<span class="stat-label">' . get_string('incorrectwithhighconfidence', 'local_confidencereasoning') . ':</span> ';
        echo '<span class="stat-value">' . $stats->incorrectwithhighconfidence . '</span>';
        echo '</div>';
        echo '</div>';
    }

    // Detailed records table
    if ($records) {
        echo '<table class="confidence-report-table">';
        echo '<thead><tr>';
        echo '<th>' . get_string('question') . '</th>';
        echo '<th>' . get_string('confidencelevel', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('reasoningcategory', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('reasoning', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('time') . '</th>';
        echo '</tr></thead>';
        echo '<tbody>';

        foreach ($records as $record) {
            $question = $DB->get_record('question', array('id' => $record->questionid));
            echo '<tr>';
            echo '<td>' . ($question ? format_string($question->name) : 'N/A') . '</td>';
            echo '<td><span class="confidence-badge confidence-badge-' . $record->confidencelevel . '">' .
                 $record->confidencelevel . '</span></td>';
            echo '<td>' . htmlspecialchars($record->reasoningcategory) . '</td>';
            echo '<td>' . format_text($record->reasoning, FORMAT_PLAIN) . '</td>';
            echo '<td>' . userdate($record->timecreated) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
    } else {
        echo '<p>' . get_string('nodata', 'moodle') . '</p>';
    }

} else {
    // All users overview
    echo '<h3>' . get_string('allusers', 'moodle') . '</h3>';

    $sql = "SELECT DISTINCT userid FROM {local_confidence_reasoning} WHERE quizid = :quizid";
    $userids = $DB->get_fieldset_sql($sql, array('quizid' => $quizid));

    if ($userids) {
        echo '<table class="confidence-report-table">';
        echo '<thead><tr>';
        echo '<th>' . get_string('student') . '</th>';
        echo '<th>' . get_string('avgconfidence', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('totalattempts', 'moodle') . '</th>';
        echo '<th>' . get_string('correctwithhighconfidence', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('incorrectwithhighconfidence', 'local_confidencereasoning') . '</th>';
        echo '<th>' . get_string('action') . '</th>';
        echo '</tr></thead>';
        echo '<tbody>';

        foreach ($userids as $uid) {
            $user = $DB->get_record('user', array('id' => $uid));
            if (!$user) {
                continue;
            }

            $stats = local_confidencereasoning_get_stats($uid, $quizid);
            if (!$stats) {
                // Calculate stats if not exist
                local_confidencereasoning_update_stats($uid, $quizid);
                $stats = local_confidencereasoning_get_stats($uid, $quizid);
            }

            echo '<tr>';
            echo '<td>' . fullname($user) . '</td>';
            echo '<td>' . ($stats ? $stats->avgconfidence : 'N/A') . '</td>';
            echo '<td>' . ($stats ? $stats->totalattempts : 0) . '</td>';
            echo '<td>' . ($stats ? $stats->correctwithhighconfidence : 0) . '</td>';
            echo '<td>' . ($stats ? $stats->incorrectwithhighconfidence : 0) . '</td>';
            echo '<td><a href="?quizid=' . $quizid . '&userid=' . $uid . '">' .
                 get_string('view') . '</a></td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
    } else {
        echo '<p>' . get_string('nodata', 'moodle') . '</p>';
    }
}

// Back link
echo '<p><a href="' . new moodle_url('/mod/quiz/view.php', array('id' => $cm->id)) . '">' .
     get_string('back') . '</a></p>';

echo $OUTPUT->footer();
