<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * List of features supported in samplinggame module
 */
function samplinggame_supports($feature) {
    switch($feature) {
        case FEATURE_GROUPS:                  return false;
        case FEATURE_GROUPINGS:               return false;
        case FEATURE_MOD_INTRO:               return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS: return true;
        case FEATURE_GRADE_HAS_GRADE:         return true;
        case FEATURE_GRADE_OUTCOMES:          return false;
        case FEATURE_BACKUP_MOODLE2:          return true;
        case FEATURE_SHOW_DESCRIPTION:        return true;
        default: return null;
    }
}

/**
 * Add a new samplinggame instance
 */
function samplinggame_add_instance($samplinggame, $mform = null) {
    global $DB;

    $samplinggame->timecreated = time();
    $samplinggame->timemodified = $samplinggame->timecreated;

    $samplinggame->id = $DB->insert_record('samplinggame', $samplinggame);

    samplinggame_grade_item_update($samplinggame);

    return $samplinggame->id;
}

/**
 * Update an existing samplinggame instance
 */
function samplinggame_update_instance($samplinggame, $mform = null) {
    global $DB;

    $samplinggame->timemodified = time();
    $samplinggame->id = $samplinggame->instance;

    $result = $DB->update_record('samplinggame', $samplinggame);

    samplinggame_grade_item_update($samplinggame);

    return $result;
}

/**
 * Delete a samplinggame instance
 */
function samplinggame_delete_instance($id) {
    global $DB;

    if (!$samplinggame = $DB->get_record('samplinggame', array('id' => $id))) {
        return false;
    }

    // Delete all attempts
    $DB->delete_records('samplinggame_attempts', array('samplinggame_id' => $id));

    // Delete the instance
    $DB->delete_records('samplinggame', array('id' => $id));

    // Delete grade item
    samplinggame_grade_item_delete($samplinggame);

    return true;
}

/**
 * Create or update grade item for the samplinggame
 */
function samplinggame_grade_item_update($samplinggame, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($samplinggame->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax'] = $samplinggame->grade;
    $item['grademin'] = 0;

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/samplinggame', $samplinggame->course, 'mod', 'samplinggame',
                        $samplinggame->id, 0, $grades, $item);
}

/**
 * Delete grade item for given samplinggame
 */
function samplinggame_grade_item_delete($samplinggame) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/samplinggame', $samplinggame->course, 'mod', 'samplinggame',
                        $samplinggame->id, 0, null, array('deleted' => 1));
}

/**
 * Update grades in central gradebook
 */
function samplinggame_update_grades($samplinggame, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($samplinggame->grade == 0) {
        samplinggame_grade_item_update($samplinggame);
    } else {
        $grades = samplinggame_get_user_grades($samplinggame, $userid);
        samplinggame_grade_item_update($samplinggame, $grades);
    }
}

/**
 * Get user grades for samplinggame
 */
function samplinggame_get_user_grades($samplinggame, $userid = 0) {
    global $DB;

    $params = array('samplinggame_id' => $samplinggame->id);
    $usersql = '';

    if ($userid) {
        $params['userid'] = $userid;
        $usersql = ' AND userid = :userid';
    }

    $sql = "SELECT userid, MAX(score) as rawgrade
            FROM {samplinggame_attempts}
            WHERE samplinggame_id = :samplinggame_id $usersql
            GROUP BY userid";

    return $DB->get_records_sql($sql, $params);
}

/**
 * Return information about user attempts
 */
function samplinggame_get_user_attempts($samplinggameid, $userid) {
    global $DB;

    return $DB->get_records('samplinggame_attempts',
                           array('samplinggame_id' => $samplinggameid, 'userid' => $userid),
                           'attempt_number DESC');
}

/**
 * Save a new attempt
 */
function samplinggame_save_attempt($samplinggameid, $userid, $selectedsamples, $score, $timespent) {
    global $DB;

    $attempts = $DB->get_records('samplinggame_attempts',
                                array('samplinggame_id' => $samplinggameid, 'userid' => $userid),
                                'attempt_number DESC', '*', 0, 1);

    $attemptnumber = 1;
    if (!empty($attempts)) {
        $lastattempt = reset($attempts);
        $attemptnumber = $lastattempt->attempt_number + 1;
    }

    $attempt = new stdClass();
    $attempt->samplinggame_id = $samplinggameid;
    $attempt->userid = $userid;
    $attempt->attempt_number = $attemptnumber;
    $attempt->selected_samples = json_encode($selectedsamples);
    $attempt->score = $score;
    $attempt->time_spent = $timespent;
    $attempt->timecreated = time();

    // Determine if correct based on score
    $samplinggame = $DB->get_record('samplinggame', array('id' => $samplinggameid));
    $attempt->is_correct = ($score >= ($samplinggame->grade * 0.7)) ? 1 : 0; // 70% threshold

    // Generate feedback
    $attempt->feedback = samplinggame_generate_feedback($samplinggame, $selectedsamples, $score);

    $attemptid = $DB->insert_record('samplinggame_attempts', $attempt);

    // Update grades
    samplinggame_update_grades($samplinggame, $userid);

    return $attemptid;
}

/**
 * Generate feedback based on the attempt
 */
function samplinggame_generate_feedback($samplinggame, $selectedsamples, $score) {
    $feedback = '';

    $percentage = ($samplinggame->grade > 0) ? ($score / $samplinggame->grade * 100) : 0;

    if ($percentage >= 90) {
        $feedback = get_string('feedback_excellent', 'mod_samplinggame');
    } else if ($percentage >= 70) {
        $feedback = get_string('feedback_good', 'mod_samplinggame');
    } else if ($percentage >= 50) {
        $feedback = get_string('feedback_needsimprovement', 'mod_samplinggame');
    } else {
        $feedback = get_string('feedback_tryagain', 'mod_samplinggame');
    }

    // Add specific feedback based on sampling method
    if ($samplinggame->sampling_method == 'simple_random') {
        $feedback .= ' ' . get_string('feedback_randomness', 'mod_samplinggame');
    } else if ($samplinggame->sampling_method == 'systematic') {
        $feedback .= ' ' . get_string('feedback_systematic', 'mod_samplinggame');
    }

    return $feedback;
}
