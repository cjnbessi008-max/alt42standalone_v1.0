<?php
// This file is part of Moodle - http://moodle.org/
//
// Truth Temperature Activity Module
// Library of interface functions and constants

defined('MOODLE_INTERNAL') || die();

/**
 * Given an object containing all the necessary data,
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param object $truthtemp An object from the form in mod_form.php
 * @return int The id of the newly inserted truthtemp record
 */
function truthtemp_add_instance($truthtemp) {
    global $DB;

    $truthtemp->timecreated = time();
    $truthtemp->timemodified = time();

    $truthtemp->id = $DB->insert_record('truthtemp', $truthtemp);

    return $truthtemp->id;
}

/**
 * Given an object containing all the necessary data,
 * will update an existing instance with new data.
 *
 * @param object $truthtemp An object from the form in mod_form.php
 * @return boolean Success/Fail
 */
function truthtemp_update_instance($truthtemp) {
    global $DB;

    $truthtemp->timemodified = time();
    $truthtemp->id = $truthtemp->instance;

    return $DB->update_record('truthtemp', $truthtemp);
}

/**
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function truthtemp_delete_instance($id) {
    global $DB;

    if (!$truthtemp = $DB->get_record('truthtemp', array('id' => $id))) {
        return false;
    }

    // Delete any dependent records
    $DB->delete_records('truthtemp_responses', array('truthtemp_id' => $id));
    $DB->delete_records('truthtemp', array('id' => $id));

    return true;
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 *
 * @param object $course
 * @param object $user
 * @param object $mod
 * @param object $truthtemp
 * @return object|null
 */
function truthtemp_user_outline($course, $user, $mod, $truthtemp) {
    global $DB;

    $count = $DB->count_records('truthtemp_responses', array(
        'truthtemp_id' => $truthtemp->id,
        'userid' => $user->id
    ));

    if ($count > 0) {
        $result = new stdClass();
        $result->info = get_string('responses', 'mod_truthtemp', $count);
        $result->time = time();
        return $result;
    }

    return null;
}

/**
 * Supported features for this module
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function truthtemp_supports($feature) {
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
 * Evaluate an inequality expression
 *
 * @param string $left_side Left side of the inequality
 * @param string $operator Comparison operator
 * @param string $right_side Right side of the inequality
 * @return bool Result of the evaluation
 */
function truthtemp_evaluate_inequality($left_side, $operator, $right_side) {
    // Sanitize and evaluate expressions safely
    $left_value = truthtemp_safe_eval($left_side);
    $right_value = truthtemp_safe_eval($right_side);

    if ($left_value === false || $right_value === false) {
        return false;
    }

    switch ($operator) {
        case '<':
            return $left_value < $right_value;
        case '<=':
            return $left_value <= $right_value;
        case '>':
            return $left_value > $right_value;
        case '>=':
            return $left_value >= $right_value;
        case '=':
        case '==':
            return abs($left_value - $right_value) < 0.0001; // Float comparison
        case '!=':
            return abs($left_value - $right_value) >= 0.0001;
        default:
            return false;
    }
}

/**
 * Safely evaluate a mathematical expression
 *
 * @param string $expression Mathematical expression
 * @return float|false Result of evaluation or false on error
 */
function truthtemp_safe_eval($expression) {
    // Remove whitespace
    $expression = trim($expression);

    // Only allow numbers, operators, and parentheses
    if (!preg_match('/^[0-9+\-*\/().\s]+$/', $expression)) {
        return false;
    }

    try {
        // Replace × with * and ÷ with /
        $expression = str_replace('×', '*', $expression);
        $expression = str_replace('÷', '/', $expression);

        // Use eval with extreme caution - only after sanitization
        $result = @eval('return ' . $expression . ';');

        if ($result === false || !is_numeric($result)) {
            return false;
        }

        return floatval($result);
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Calculate temperature based on truth value
 *
 * @param bool $is_true Whether the inequality is true
 * @return int Temperature value (-20 to 50)
 */
function truthtemp_calculate_temperature($is_true) {
    if ($is_true) {
        // True: warm to hot (30-50 degrees)
        return rand(30, 50);
    } else {
        // False: cold to cool (-20 to 10 degrees)
        return rand(-20, 10);
    }
}

/**
 * Get temperature type based on value
 *
 * @param int $temperature Temperature value
 * @return string Temperature type (cold, cool, warm, hot)
 */
function truthtemp_get_temperature_type($temperature) {
    if ($temperature < 0) {
        return 'cold';
    } else if ($temperature < 20) {
        return 'cool';
    } else if ($temperature < 35) {
        return 'warm';
    } else {
        return 'hot';
    }
}
