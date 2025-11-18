<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - View page
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once(__DIR__ . '/classes/game_engine.php');

use mod_minitrial\game_engine;

$id = optional_param('id', 0, PARAM_INT); // Course Module ID
$action = optional_param('action', '', PARAM_ALPHA);

if ($id) {
    $cm = get_coursemodule_from_id('minitrial', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $minitrial = $DB->get_record('minitrial', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingidandcmid', 'minitrial');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/minitrial:view', $context);

// Log view
$event = \mod_minitrial\event\course_module_viewed::create(array(
    'objectid' => $minitrial->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('minitrial', $minitrial);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/minitrial/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($minitrial->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle actions
if ($action === 'runtrial' && has_capability('mod/minitrial:submit', $context)) {
    require_sesskey();

    // Get or create progress record
    $progress = $DB->get_record('minitrial_progress',
        array('minitrial' => $minitrial->id, 'userid' => $USER->id));

    if (!$progress) {
        $progress = new stdClass();
        $progress->minitrial = $minitrial->id;
        $progress->userid = $USER->id;
        $progress->trials_completed = 0;
        $progress->statistics = '';
        $progress->grade = 0;
        $progress->completed = 0;
        $progress->timestarted = time();
        $progress->timemodified = time();
        $progress->id = $DB->insert_record('minitrial_progress', $progress);
    }

    // Run the trial
    $engine = new game_engine($minitrial->game_type);
    $result = $engine->run_trial();

    // Save attempt
    $attempt = new stdClass();
    $attempt->minitrial = $minitrial->id;
    $attempt->userid = $USER->id;
    $attempt->trial_number = $progress->trials_completed + 1;
    $attempt->result = $result;
    $attempt->timecreated = time();
    $DB->insert_record('minitrial_attempts', $attempt);

    // Update progress
    $progress->trials_completed++;
    $progress->timemodified = time();

    // Check if completed
    if ($progress->trials_completed >= $minitrial->trials_required && !$progress->completed) {
        $progress->completed = 1;
        $progress->timecompleted = time();
    }

    // Calculate grade
    $progress->grade = minitrial_calculate_grade($minitrial->id, $USER->id);

    $DB->update_record('minitrial_progress', $progress);

    // Update gradebook
    minitrial_update_grades($minitrial, $USER->id);

    redirect($PAGE->url, get_string('rollresult', 'minitrial', $result), null, \core\output\notification::NOTIFY_SUCCESS);
}

if ($action === 'reset' && has_capability('mod/minitrial:submit', $context)) {
    require_sesskey();

    $DB->delete_records('minitrial_attempts', array('minitrial' => $minitrial->id, 'userid' => $USER->id));
    $DB->delete_records('minitrial_progress', array('minitrial' => $minitrial->id, 'userid' => $USER->id));

    minitrial_update_grades($minitrial, $USER->id, true);

    redirect($PAGE->url);
}

// Get progress
$progress = $DB->get_record('minitrial_progress',
    array('minitrial' => $minitrial->id, 'userid' => $USER->id));

// Get attempts
$attempts = $DB->get_records('minitrial_attempts',
    array('minitrial' => $minitrial->id, 'userid' => $USER->id),
    'trial_number ASC');

// Calculate statistics
$engine = new game_engine($minitrial->game_type);
$experimental_probs = $engine->calculate_experimental_probabilities($attempts);
$theoretical_probs = $engine->get_theoretical_probabilities();

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($minitrial->name));

// Display intro
echo $OUTPUT->box_start('generalbox boxaligncenter', 'intro');
echo format_module_intro('minitrial', $minitrial, $cm->id);
echo $OUTPUT->box_end();

// Display progress
if ($progress) {
    $a = new stdClass();
    $a->completed = $progress->trials_completed;
    $a->required = $minitrial->trials_required;
    echo html_writer::tag('p', get_string('trialscompleted', 'minitrial', $a), array('class' => 'alert alert-info'));

    if ($progress->completed) {
        echo html_writer::tag('div', get_string('congratulations', 'minitrial'), array('class' => 'alert alert-success'));
        echo html_writer::tag('p', get_string('activitycompleted', 'minitrial'));
    }
} else {
    $a = new stdClass();
    $a->completed = 0;
    $a->required = $minitrial->trials_required;
    echo html_writer::tag('p', get_string('trialscompleted', 'minitrial', $a), array('class' => 'alert alert-info'));
}

// Display game interface in smartphone frame
echo '<div class="smartphone-frame" style="position: fixed; bottom: 20px; right: 20px; width: 375px; height: 667px; border: 16px solid #333; border-radius: 36px; background: #fff; box-shadow: 0 0 20px rgba(0,0,0,0.3); overflow: hidden; z-index: 1000;">';
echo '<div class="game-container" style="height: 100%; overflow-y: auto; padding: 20px;">';

// Game title
echo html_writer::tag('h3', get_string('gametype_' . $minitrial->game_type, 'minitrial'), array('style' => 'text-align: center; margin-bottom: 20px;'));

// Run trial button
if (has_capability('mod/minitrial:submit', $context)) {
    if (!$progress || $progress->trials_completed < $minitrial->trials_required) {
        $url = new moodle_url('/mod/minitrial/view.php', array('id' => $cm->id, 'action' => 'runtrial', 'sesskey' => sesskey()));
        echo html_writer::link($url, get_string('runtrial', 'minitrial'), array('class' => 'btn btn-primary btn-lg btn-block', 'style' => 'margin-bottom: 20px; padding: 15px;'));
    }

    // Reset button
    if ($progress && $progress->trials_completed > 0) {
        $url = new moodle_url('/mod/minitrial/view.php', array('id' => $cm->id, 'action' => 'reset', 'sesskey' => sesskey()));
        echo html_writer::link($url, get_string('resettrial', 'minitrial'), array('class' => 'btn btn-secondary btn-sm btn-block', 'style' => 'margin-bottom: 20px;'));
    }
}

// Display statistics
if (!empty($attempts)) {
    echo '<div class="statistics-panel" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">';
    echo html_writer::tag('h4', get_string('statistics', 'minitrial'), array('style' => 'margin-top: 0;'));

    echo '<table class="table table-sm" style="font-size: 14px;">';
    echo '<thead><tr>';
    echo '<th>' . get_string('result', 'minitrial') . '</th>';
    echo '<th>' . get_string('frequency', 'minitrial') . '</th>';
    echo '<th>' . get_string('experimental', 'minitrial') . '</th>';
    echo '<th>' . get_string('theoretical', 'minitrial') . '</th>';
    echo '</tr></thead><tbody>';

    $outcomes = $engine->get_possible_outcomes();
    foreach ($outcomes as $outcome) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($outcome) . '</td>';

        $freq = 0;
        foreach ($attempts as $attempt) {
            $result = $attempt->result;
            if ($minitrial->game_type === 'card' && strpos($result, '_of_') !== false) {
                $parts = explode('_of_', $result);
                $result = $parts[1];
            }
            if ($result === $outcome) {
                $freq++;
            }
        }

        echo '<td>' . $freq . '</td>';
        echo '<td>' . number_format(isset($experimental_probs[$outcome]) ? $experimental_probs[$outcome] * 100 : 0, 1) . '%</td>';
        echo '<td>' . number_format($theoretical_probs[$outcome] * 100, 1) . '%</td>';
        echo '</tr>';
    }

    echo '</tbody></table>';
    echo '</div>';

    // Recent results
    echo '<div class="recent-results" style="background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px;">';
    echo html_writer::tag('h4', get_string('result', 'minitrial') . 's', array('style' => 'margin-top: 0;'));
    echo '<div style="max-height: 200px; overflow-y: auto;">';
    $recent = array_slice(array_reverse($attempts), 0, 10);
    foreach ($recent as $attempt) {
        echo '<div style="padding: 5px; border-bottom: 1px solid #eee;">';
        echo '<strong>#' . $attempt->trial_number . '</strong>: ' . htmlspecialchars($attempt->result);
        echo '</div>';
    }
    echo '</div>';
    echo '</div>';
}

echo '</div>'; // game-container
echo '</div>'; // smartphone-frame

echo $OUTPUT->footer();
