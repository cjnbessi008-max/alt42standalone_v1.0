<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for module dualdance
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function dualdance_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the dualdance into the database
 *
 * @param stdClass $dualdance Submitted data from the form
 * @param mod_dualdance_mod_form $mform The form instance
 * @return int The id of the newly inserted dualdance record
 */
function dualdance_add_instance(stdClass $dualdance, mod_dualdance_mod_form $mform = null) {
    global $DB;

    $dualdance->timecreated = time();
    $dualdance->timemodified = time();

    $dualdance->id = $DB->insert_record('dualdance', $dualdance);

    dualdance_grade_item_update($dualdance);

    return $dualdance->id;
}

/**
 * Updates an instance of the dualdance in the database
 *
 * @param stdClass $dualdance An object from the form
 * @param mod_dualdance_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function dualdance_update_instance(stdClass $dualdance, mod_dualdance_mod_form $mform = null) {
    global $DB;

    $dualdance->timemodified = time();
    $dualdance->id = $dualdance->instance;

    $result = $DB->update_record('dualdance', $dualdance);

    dualdance_grade_item_update($dualdance);

    return $result;
}

/**
 * Removes an instance of the dualdance from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function dualdance_delete_instance($id) {
    global $DB;

    if (!$dualdance = $DB->get_record('dualdance', array('id' => $id))) {
        return false;
    }

    // Delete related records
    $DB->delete_records('dualdance_attempts', array('dualdanceid' => $id));
    $DB->delete_records('dualdance_problems', array('dualdanceid' => $id));
    $DB->delete_records('dualdance_grades', array('dualdanceid' => $id));
    $DB->delete_records('dualdance', array('id' => $id));

    dualdance_grade_item_delete($dualdance);

    return true;
}

/**
 * Create/update grade item for given dualdance
 *
 * @param stdClass $dualdance object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function dualdance_grade_item_update($dualdance, $grades = null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $params = array('itemname' => $dualdance->name);
    if (isset($dualdance->cmidnumber)) {
        $params['idnumber'] = $dualdance->cmidnumber;
    }

    if ($dualdance->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax']  = $dualdance->grade;
        $params['grademin']  = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/dualdance', $dualdance->course, 'mod', 'dualdance',
                        $dualdance->id, 0, $grades, $params);
}

/**
 * Delete grade item for given dualdance
 *
 * @param stdClass $dualdance object
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, GRADE_UPDATE_MULTIPLE or GRADE_UPDATE_ITEM_LOCKED
 */
function dualdance_grade_item_delete($dualdance) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/dualdance', $dualdance->course, 'mod', 'dualdance',
                        $dualdance->id, 0, null, array('deleted' => 1));
}

/**
 * Update grades in the gradebook
 *
 * @param stdClass $dualdance The dualdance instance
 * @param int $userid specific user only, 0 means all
 * @param boolean $nullifnone return null if grade does not exist
 * @return void
 */
function dualdance_update_grades($dualdance, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($userid != 0) {
        $grades = dualdance_get_user_grades($dualdance, $userid);
        dualdance_grade_item_update($dualdance, $grades);
    } else {
        $grades = dualdance_get_user_grades($dualdance);
        dualdance_grade_item_update($dualdance, $grades);
    }
}

/**
 * Return grade for given user or all users.
 *
 * @param stdClass $dualdance The dualdance instance
 * @param int $userid optional user id, 0 means all users
 * @return array array of grades, false if none
 */
function dualdance_get_user_grades($dualdance, $userid = 0) {
    global $DB;

    $params = array('dualdanceid' => $dualdance->id);
    $sql = "SELECT userid, grade, timemodified as dategraded
            FROM {dualdance_grades}
            WHERE dualdanceid = :dualdanceid";

    if ($userid != 0) {
        $params['userid'] = $userid;
        $sql .= " AND userid = :userid";
    }

    return $DB->get_records_sql($sql, $params);
}

/**
 * Generate a new problem for the dual dance activity
 *
 * @param stdClass $dualdance The dualdance instance
 * @return stdClass The generated problem
 */
function dualdance_generate_problem($dualdance) {
    global $DB;

    // Generate random bases within configured ranges
    $exp_base = rand($dualdance->exp_base_min * 100, $dualdance->exp_base_max * 100) / 100;
    $log_base = rand($dualdance->log_base_min * 100, $dualdance->log_base_max * 100) / 100;

    // Generate coefficients based on difficulty
    $difficulty_factor = $dualdance->difficulty / 5;
    $exp_coeff = rand(50, 200) / 100;
    $log_coeff = rand(50, 200) / 100;

    // Problem types: exponential, logarithmic, intersection
    $problem_types = array('exponential', 'logarithmic', 'intersection');
    $problem_type = $problem_types[array_rand($problem_types)];

    $problem = new stdClass();
    $problem->dualdanceid = $dualdance->id;
    $problem->problem_type = $problem_type;
    $problem->exp_base = $exp_base;
    $problem->log_base = $log_base;
    $problem->exp_coefficient = $exp_coeff;
    $problem->log_coefficient = $log_coeff;
    $problem->timecreated = time();

    switch ($problem_type) {
        case 'exponential':
            $x = rand(1, 5);
            $answer = $exp_coeff * pow($exp_base, $x);
            $problem->question_text = get_string('question_exponential', 'dualdance',
                array('coeff' => $exp_coeff, 'base' => $exp_base, 'x' => $x));
            $problem->answer = round($answer, 4);
            $problem->tolerance = 0.01;
            break;

        case 'logarithmic':
            $value = rand(10, 100);
            $answer = $log_coeff * log($value) / log($log_base);
            $problem->question_text = get_string('question_logarithmic', 'dualdance',
                array('coeff' => $log_coeff, 'base' => $log_base, 'value' => $value));
            $problem->answer = round($answer, 4);
            $problem->tolerance = 0.01;
            break;

        case 'intersection':
            // Simplified intersection problem
            $answer = rand(1, 10);
            $problem->question_text = get_string('question_intersection', 'dualdance',
                array('exp_coeff' => $exp_coeff, 'exp_base' => $exp_base,
                      'log_coeff' => $log_coeff, 'log_base' => $log_base));
            $problem->answer = round($answer, 4);
            $problem->tolerance = 0.1;
            break;
    }

    $problem->id = $DB->insert_record('dualdance_problems', $problem);
    return $problem;
}

/**
 * Submit an answer for a problem
 *
 * @param stdClass $dualdance The dualdance instance
 * @param int $problemid The problem ID
 * @param int $userid The user ID
 * @param float $answer The submitted answer
 * @param int $time_spent Time spent in seconds
 * @param string $interaction_data JSON encoded interaction data
 * @return stdClass The attempt record
 */
function dualdance_submit_answer($dualdance, $problemid, $userid, $answer, $time_spent, $interaction_data = '') {
    global $DB;

    $problem = $DB->get_record('dualdance_problems', array('id' => $problemid), '*', MUST_EXIST);

    $attempt = new stdClass();
    $attempt->dualdanceid = $dualdance->id;
    $attempt->problemid = $problemid;
    $attempt->userid = $userid;
    $attempt->answer = $answer;
    $attempt->time_spent = $time_spent;
    $attempt->interaction_data = $interaction_data;
    $attempt->timecreated = time();

    // Check if answer is correct within tolerance
    $is_correct = abs($answer - $problem->answer) <= $problem->tolerance;
    $attempt->is_correct = $is_correct ? 1 : 0;

    // Calculate grade (100 for correct, penalty for time)
    if ($is_correct) {
        $base_grade = 100;
        $time_penalty = min(20, $time_spent / 10); // Max 20% penalty
        $attempt->grade = max(50, $base_grade - $time_penalty);
    } else {
        $attempt->grade = 0;
    }

    $attempt->id = $DB->insert_record('dualdance_attempts', $attempt);

    // Update overall grade
    dualdance_update_user_grade($dualdance, $userid);

    return $attempt;
}

/**
 * Update a user's overall grade
 *
 * @param stdClass $dualdance The dualdance instance
 * @param int $userid The user ID
 */
function dualdance_update_user_grade($dualdance, $userid) {
    global $DB;

    $sql = "SELECT COUNT(*) as total, SUM(is_correct) as correct,
                   SUM(time_spent) as total_time, AVG(grade) as avg_grade
            FROM {dualdance_attempts}
            WHERE dualdanceid = :dualdanceid AND userid = :userid";

    $stats = $DB->get_record_sql($sql, array('dualdanceid' => $dualdance->id, 'userid' => $userid));

    $grade_record = $DB->get_record('dualdance_grades',
        array('dualdanceid' => $dualdance->id, 'userid' => $userid));

    if (!$grade_record) {
        $grade_record = new stdClass();
        $grade_record->dualdanceid = $dualdance->id;
        $grade_record->userid = $userid;
        $grade_record->grade = $stats->avg_grade ?: 0;
        $grade_record->attempts_count = $stats->total ?: 0;
        $grade_record->correct_count = $stats->correct ?: 0;
        $grade_record->total_time = $stats->total_time ?: 0;
        $grade_record->timemodified = time();
        $DB->insert_record('dualdance_grades', $grade_record);
    } else {
        $grade_record->grade = $stats->avg_grade ?: 0;
        $grade_record->attempts_count = $stats->total ?: 0;
        $grade_record->correct_count = $stats->correct ?: 0;
        $grade_record->total_time = $stats->total_time ?: 0;
        $grade_record->timemodified = time();
        $DB->update_record('dualdance_grades', $grade_record);
    }

    // Update gradebook
    $grades = new stdClass();
    $grades->userid = $userid;
    $grades->rawgrade = ($grade_record->grade / 100) * $dualdance->grade;
    $grades->dategraded = time();

    dualdance_grade_item_update($dualdance, $grades);
}
