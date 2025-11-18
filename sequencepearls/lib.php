<?php
// This file is part of Moodle - http://moodle.org/
//
// Core library functions for Sequence Pearls activity module

defined('MOODLE_INTERNAL') || die();

/**
 * Add a new sequencepearls activity instance
 */
function sequencepearls_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $id = $DB->insert_record('sequencepearls', $data);

    // Generate problems for this activity
    sequencepearls_generate_problems($id, $data);

    return $id;
}

/**
 * Update an existing sequencepearls activity instance
 */
function sequencepearls_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    $DB->update_record('sequencepearls', $data);

    // Regenerate problems if settings changed
    $DB->delete_records('sequencepearls_problems', array('sequencepearls_id' => $data->id));
    sequencepearls_generate_problems($data->id, $data);

    return true;
}

/**
 * Delete a sequencepearls activity instance
 */
function sequencepearls_delete_instance($id) {
    global $DB;

    if (!$sequencepearls = $DB->get_record('sequencepearls', array('id' => $id))) {
        return false;
    }

    // Delete related records
    $DB->delete_records('sequencepearls_attempts', array('sequencepearls_id' => $id));
    $DB->delete_records('sequencepearls_progress', array('sequencepearls_id' => $id));
    $DB->delete_records('sequencepearls_problems', array('sequencepearls_id' => $id));
    $DB->delete_records('sequencepearls', array('id' => $id));

    return true;
}

/**
 * Generate sequence problems based on activity settings
 */
function sequencepearls_generate_problems($activityid, $settings) {
    global $DB;

    $numProblems = isset($settings->num_problems) ? $settings->num_problems : 10;
    $sequenceType = isset($settings->sequence_type) ? $settings->sequence_type : 'arithmetic';
    $difficulty = isset($settings->difficulty) ? $settings->difficulty : 1;

    for ($i = 0; $i < $numProblems; $i++) {
        $problem = new stdClass();
        $problem->sequencepearls_id = $activityid;
        $problem->timecreated = time();

        // Generate sequence based on type
        switch ($sequenceType) {
            case 'arithmetic':
                $sequence = sequencepearls_generate_arithmetic($difficulty);
                break;
            case 'geometric':
                $sequence = sequencepearls_generate_geometric($difficulty);
                break;
            case 'fibonacci':
                $sequence = sequencepearls_generate_fibonacci($difficulty);
                break;
            default:
                $sequence = sequencepearls_generate_arithmetic($difficulty);
        }

        $problem->sequence_data = json_encode($sequence['values']);
        $problem->missing_position = $sequence['missing_pos'];
        $problem->correct_answer = $sequence['answer'];
        $problem->rule_formula = $sequence['formula'];

        $DB->insert_record('sequencepearls_problems', $problem);
    }
}

/**
 * Generate arithmetic sequence
 */
function sequencepearls_generate_arithmetic($difficulty) {
    $length = 5 + $difficulty; // 6-10 terms
    $start = rand(1, 20);
    $diff = rand(1, 10) * $difficulty; // Common difference

    $values = array();
    for ($i = 0; $i < $length; $i++) {
        $values[] = $start + ($i * $diff);
    }

    // Choose a random position to hide (not first or last)
    $missingPos = rand(1, $length - 2);
    $answer = $values[$missingPos];

    return array(
        'values' => $values,
        'missing_pos' => $missingPos,
        'answer' => $answer,
        'formula' => "a_n = {$start} + (n × {$diff})"
    );
}

/**
 * Generate geometric sequence
 */
function sequencepearls_generate_geometric($difficulty) {
    $length = 5 + min($difficulty, 2); // 6-7 terms (geometric grows fast)
    $start = rand(1, 10);
    $ratio = rand(2, 3); // Common ratio

    $values = array();
    for ($i = 0; $i < $length; $i++) {
        $values[] = $start * pow($ratio, $i);
    }

    $missingPos = rand(1, $length - 2);
    $answer = $values[$missingPos];

    return array(
        'values' => $values,
        'missing_pos' => $missingPos,
        'answer' => $answer,
        'formula' => "a_n = {$start} × {$ratio}^n"
    );
}

/**
 * Generate Fibonacci-like sequence
 */
function sequencepearls_generate_fibonacci($difficulty) {
    $length = 6 + $difficulty;
    $a = rand(0, 3);
    $b = rand(1, 5);

    $values = array($a, $b);
    for ($i = 2; $i < $length; $i++) {
        $values[] = $values[$i-1] + $values[$i-2];
    }

    $missingPos = rand(2, $length - 2);
    $answer = $values[$missingPos];

    return array(
        'values' => $values,
        'missing_pos' => $missingPos,
        'answer' => $answer,
        'formula' => "a_n = a_(n-1) + a_(n-2)"
    );
}

/**
 * Check if user's answer is correct
 */
function sequencepearls_check_answer($problemid, $userid, $answer, $timeSpent) {
    global $DB;

    $problem = $DB->get_record('sequencepearls_problems', array('id' => $problemid), '*', MUST_EXIST);
    $isCorrect = (abs($answer - $problem->correct_answer) < 0.01); // Allow small floating point errors

    // Record attempt
    $attempt = new stdClass();
    $attempt->sequencepearls_id = $problem->sequencepearls_id;
    $attempt->problem_id = $problemid;
    $attempt->userid = $userid;
    $attempt->user_answer = $answer;
    $attempt->is_correct = $isCorrect ? 1 : 0;
    $attempt->time_spent = $timeSpent;
    $attempt->timecreated = time();

    $DB->insert_record('sequencepearls_attempts', $attempt);

    // Update progress
    sequencepearls_update_progress($problem->sequencepearls_id, $userid, $isCorrect);

    return $isCorrect;
}

/**
 * Update student progress
 */
function sequencepearls_update_progress($activityid, $userid, $isCorrect) {
    global $DB;

    $progress = $DB->get_record('sequencepearls_progress',
        array('sequencepearls_id' => $activityid, 'userid' => $userid));

    if (!$progress) {
        $progress = new stdClass();
        $progress->sequencepearls_id = $activityid;
        $progress->userid = $userid;
        $progress->problems_attempted = 0;
        $progress->problems_correct = 0;
        $progress->best_streak = 0;
        $progress->current_streak = 0;
        $progress->total_time_spent = 0;
        $progress->timecreated = time();
    }

    $progress->problems_attempted++;
    if ($isCorrect) {
        $progress->problems_correct++;
        $progress->current_streak++;
        if ($progress->current_streak > $progress->best_streak) {
            $progress->best_streak = $progress->current_streak;
        }
    } else {
        $progress->current_streak = 0;
    }

    // Calculate completion percentage
    $activity = $DB->get_record('sequencepearls', array('id' => $activityid));
    $progress->completion_percentage = ($progress->problems_correct / $activity->num_problems) * 100;
    $progress->timemodified = time();

    if (isset($progress->id)) {
        $DB->update_record('sequencepearls_progress', $progress);
    } else {
        $DB->insert_record('sequencepearls_progress', $progress);
    }

    return $progress;
}

/**
 * Get next problem for user
 */
function sequencepearls_get_next_problem($activityid, $userid) {
    global $DB;

    // Get all problems for this activity
    $problems = $DB->get_records('sequencepearls_problems',
        array('sequencepearls_id' => $activityid), 'id ASC');

    // Get user's attempts
    $sql = "SELECT DISTINCT problem_id
            FROM {sequencepearls_attempts}
            WHERE sequencepearls_id = ? AND userid = ? AND is_correct = 1";
    $solved = $DB->get_records_sql($sql, array($activityid, $userid));
    $solvedIds = array_keys($solved);

    // Find first unsolved problem
    foreach ($problems as $problem) {
        if (!in_array($problem->id, $solvedIds)) {
            return $problem;
        }
    }

    // All problems solved, return a random one
    return $problems[array_rand($problems)];
}

/**
 * Supports for Moodle features
 */
function sequencepearls_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        default:
            return null;
    }
}
