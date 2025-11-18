<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Add density compare instance
 */
function densitycompare_add_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $DB->insert_record('densitycompare', $data);

    return $data->id;
}

/**
 * Update density compare instance
 */
function densitycompare_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('densitycompare', $data);
}

/**
 * Delete density compare instance
 */
function densitycompare_delete_instance($id) {
    global $DB;

    if (!$densitycompare = $DB->get_record('densitycompare', array('id' => $id))) {
        return false;
    }

    // Delete all problems
    $problems = $DB->get_records('densitycompare_problems', array('densitycompare_id' => $id));
    foreach ($problems as $problem) {
        // Delete all attempts for this problem
        $DB->delete_records('densitycompare_attempts', array('problem_id' => $problem->id));
    }
    $DB->delete_records('densitycompare_problems', array('densitycompare_id' => $id));

    // Delete the instance
    $DB->delete_records('densitycompare', array('id' => $id));

    return true;
}

/**
 * Get user outline (for course overview)
 */
function densitycompare_user_outline($course, $user, $mod, $densitycompare) {
    global $DB;

    $sql = "SELECT COUNT(DISTINCT da.id) as attempts,
                   SUM(da.is_correct) as correct
            FROM {densitycompare_attempts} da
            JOIN {densitycompare_problems} dp ON da.problem_id = dp.id
            WHERE dp.densitycompare_id = ? AND da.userid = ?";

    $result = $DB->get_record_sql($sql, array($densitycompare->id, $user->id));

    if ($result && $result->attempts > 0) {
        $accuracy = round(($result->correct / $result->attempts) * 100);
        return (object) array(
            'info' => get_string('attempts', 'quiz') . ': ' . $result->attempts .
                      ' (' . $accuracy . '% ' . get_string('correct', 'mod_densitycompare') . ')'
        );
    }

    return null;
}

/**
 * Supported features
 */
function densitycompare_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        default:
            return null;
    }
}

/**
 * Get a random problem for the given activity
 */
function densitycompare_get_random_problem($densitycompareid) {
    global $DB;

    $problems = $DB->get_records('densitycompare_problems',
                                 array('densitycompare_id' => $densitycompareid));

    if (empty($problems)) {
        // Create default problems if none exist
        densitycompare_create_default_problems($densitycompareid);
        $problems = $DB->get_records('densitycompare_problems',
                                     array('densitycompare_id' => $densitycompareid));
    }

    $random_key = array_rand($problems);
    return $problems[$random_key];
}

/**
 * Create default problems
 */
function densitycompare_create_default_problems($densitycompareid) {
    global $DB;

    $problems = array(
        // Rectangle vs Rectangle
        array(
            'problem_type' => 'rectangle',
            'shape1_data' => json_encode(array('width' => 80, 'height' => 60)),
            'shape2_data' => json_encode(array('width' => 70, 'height' => 50)),
            'question_text' => 'Which rectangle has a larger area?',
            'correct_answer' => 'larger',
            'difficulty' => 1
        ),
        // Circle vs Circle
        array(
            'problem_type' => 'circle',
            'shape1_data' => json_encode(array('radius' => 40)),
            'shape2_data' => json_encode(array('radius' => 50)),
            'question_text' => 'Which circle has a larger area?',
            'correct_answer' => 'smaller',
            'difficulty' => 1
        ),
        // Rectangle vs Circle
        array(
            'problem_type' => 'mixed',
            'shape1_data' => json_encode(array('type' => 'rectangle', 'width' => 60, 'height' => 60)),
            'shape2_data' => json_encode(array('type' => 'circle', 'radius' => 35)),
            'question_text' => 'Which shape has a larger area?',
            'correct_answer' => 'larger',
            'difficulty' => 2
        ),
        // Equal areas
        array(
            'problem_type' => 'rectangle',
            'shape1_data' => json_encode(array('width' => 50, 'height' => 60)),
            'shape2_data' => json_encode(array('width' => 60, 'height' => 50)),
            'question_text' => 'Which rectangle has a larger area?',
            'correct_answer' => 'equal',
            'difficulty' => 2
        ),
    );

    foreach ($problems as $problem) {
        $record = new stdClass();
        $record->densitycompare_id = $densitycompareid;
        $record->problem_type = $problem['problem_type'];
        $record->shape1_data = $problem['shape1_data'];
        $record->shape2_data = $problem['shape2_data'];
        $record->color1 = '#FF6B6B';
        $record->color2 = '#4ECDC4';
        $record->question_text = $problem['question_text'];
        $record->correct_answer = $problem['correct_answer'];
        $record->difficulty = $problem['difficulty'];
        $record->timecreated = time();

        $DB->insert_record('densitycompare_problems', $record);
    }
}

/**
 * Submit an attempt
 */
function densitycompare_submit_attempt($problemid, $userid, $answer, $timespent) {
    global $DB;

    $problem = $DB->get_record('densitycompare_problems', array('id' => $problemid), '*', MUST_EXIST);

    $attempt = new stdClass();
    $attempt->problem_id = $problemid;
    $attempt->userid = $userid;
    $attempt->answer = $answer;
    $attempt->is_correct = ($answer === $problem->correct_answer) ? 1 : 0;
    $attempt->time_spent = $timespent;
    $attempt->timeattempted = time();

    $DB->insert_record('densitycompare_attempts', $attempt);

    return $attempt;
}
