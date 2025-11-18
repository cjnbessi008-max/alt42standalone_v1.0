<?php
// This file is part of Rule Patternizer

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return true | null True if the feature is supported, null otherwise.
 */
function rulepatternizer_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the rulepatternizer into the database.
 *
 * @param stdClass $rulepatternizer An object from the form
 * @param mod_rulepatternizer_mod_form $mform The form
 * @return int The id of the newly inserted record
 */
function rulepatternizer_add_instance($rulepatternizer, $mform = null) {
    global $DB;

    $rulepatternizer->timecreated = time();
    $rulepatternizer->timemodified = time();

    $id = $DB->insert_record('rulepatternizer', $rulepatternizer);

    return $id;
}

/**
 * Updates an instance of the rulepatternizer in the database.
 *
 * @param stdClass $rulepatternizer An object from the form
 * @param mod_rulepatternizer_mod_form $mform The form
 * @return bool True if successful
 */
function rulepatternizer_update_instance($rulepatternizer, $mform = null) {
    global $DB;

    $rulepatternizer->timemodified = time();
    $rulepatternizer->id = $rulepatternizer->instance;

    return $DB->update_record('rulepatternizer', $rulepatternizer);
}

/**
 * Removes an instance of the rulepatternizer from the database.
 *
 * @param int $id Id of the module instance
 * @return bool True if successful
 */
function rulepatternizer_delete_instance($id) {
    global $DB;

    if (!$rulepatternizer = $DB->get_record('rulepatternizer', array('id' => $id))) {
        return false;
    }

    // Delete related records
    $DB->delete_records('rulepatternizer_progress', array('rulepatternizer_id' => $id));
    $DB->delete_records('rulepatternizer_problems', array('rulepatternizer_id' => $id));

    // Delete the instance
    $DB->delete_records('rulepatternizer', array('id' => $id));

    return true;
}

/**
 * Get a rule by ID
 *
 * @param int $ruleid
 * @return stdClass|false
 */
function rulepatternizer_get_rule($ruleid) {
    global $DB;
    return $DB->get_record('rulepatternizer_rules', array('id' => $ruleid));
}

/**
 * Get all rules
 *
 * @return array
 */
function rulepatternizer_get_all_rules() {
    global $DB;
    return $DB->get_records('rulepatternizer_rules', null, 'difficulty_level ASC, id ASC');
}

/**
 * Get problems for a specific rule
 *
 * @param int $ruleid
 * @param int $instanceid
 * @return array
 */
function rulepatternizer_get_problems_by_rule($ruleid, $instanceid) {
    global $DB;
    return $DB->get_records('rulepatternizer_problems',
        array('rule_id' => $ruleid, 'rulepatternizer_id' => $instanceid),
        'difficulty_level ASC, id ASC');
}

/**
 * Get a random problem for a rule
 *
 * @param int $ruleid
 * @param int $instanceid
 * @return stdClass|false
 */
function rulepatternizer_get_random_problem($ruleid, $instanceid) {
    global $DB;

    $sql = "SELECT * FROM {rulepatternizer_problems}
            WHERE rule_id = :ruleid AND rulepatternizer_id = :instanceid
            ORDER BY RAND()
            LIMIT 1";

    return $DB->get_record_sql($sql, array('ruleid' => $ruleid, 'instanceid' => $instanceid));
}

/**
 * Get user progress for a specific rule
 *
 * @param int $userid
 * @param int $ruleid
 * @param int $instanceid
 * @return stdClass|false
 */
function rulepatternizer_get_user_progress($userid, $ruleid, $instanceid) {
    global $DB;
    return $DB->get_record('rulepatternizer_progress',
        array('userid' => $userid, 'rule_id' => $ruleid, 'rulepatternizer_id' => $instanceid));
}

/**
 * Update user progress
 *
 * @param int $userid
 * @param int $instanceid
 * @param int $ruleid
 * @param int $problemid
 * @param bool $iscorrect
 * @return bool
 */
function rulepatternizer_update_progress($userid, $instanceid, $ruleid, $problemid, $iscorrect) {
    global $DB;

    $progress = $DB->get_record('rulepatternizer_progress',
        array('userid' => $userid, 'rule_id' => $ruleid,
              'problem_id' => $problemid, 'rulepatternizer_id' => $instanceid));

    if (!$progress) {
        // Create new progress record
        $progress = new stdClass();
        $progress->userid = $userid;
        $progress->rulepatternizer_id = $instanceid;
        $progress->rule_id = $ruleid;
        $progress->problem_id = $problemid;
        $progress->attempts = 1;
        $progress->correct_count = $iscorrect ? 1 : 0;
        $progress->mastery_level = $iscorrect ? 10 : 0;
        $progress->last_attempt_time = time();
        $progress->timecreated = time();
        $progress->timemodified = time();

        return $DB->insert_record('rulepatternizer_progress', $progress);
    } else {
        // Update existing progress
        $progress->attempts++;
        if ($iscorrect) {
            $progress->correct_count++;
        }

        // Calculate mastery level (0-100)
        $progress->mastery_level = min(100, ($progress->correct_count / $progress->attempts) * 100);

        $progress->last_attempt_time = time();
        $progress->timemodified = time();

        return $DB->update_record('rulepatternizer_progress', $progress);
    }
}

/**
 * Log user answer
 *
 * @param int $userid
 * @param int $problemid
 * @param string $useranswer
 * @param bool $iscorrect
 * @param int $timetaken
 * @return int
 */
function rulepatternizer_log_answer($userid, $problemid, $useranswer, $iscorrect, $timetaken = 0) {
    global $DB;

    $answer = new stdClass();
    $answer->userid = $userid;
    $answer->problem_id = $problemid;
    $answer->user_answer = $useranswer;
    $answer->is_correct = $iscorrect ? 1 : 0;
    $answer->time_taken = $timetaken;
    $answer->timecreated = time();

    return $DB->insert_record('rulepatternizer_answers', $answer);
}

/**
 * Get overall user statistics
 *
 * @param int $userid
 * @param int $instanceid
 * @return stdClass
 */
function rulepatternizer_get_user_stats($userid, $instanceid) {
    global $DB;

    $sql = "SELECT
                COUNT(DISTINCT rule_id) as rules_attempted,
                SUM(attempts) as total_attempts,
                SUM(correct_count) as total_correct,
                AVG(mastery_level) as avg_mastery
            FROM {rulepatternizer_progress}
            WHERE userid = :userid AND rulepatternizer_id = :instanceid";

    return $DB->get_record_sql($sql, array('userid' => $userid, 'instanceid' => $instanceid));
}

/**
 * Check if answer is correct (simple string comparison, can be enhanced)
 *
 * @param string $useranswer
 * @param string $correctanswer
 * @return bool
 */
function rulepatternizer_check_answer($useranswer, $correctanswer) {
    // Remove whitespace and convert to lowercase for comparison
    $useranswer = strtolower(trim(preg_replace('/\s+/', '', $useranswer)));
    $correctanswer = strtolower(trim(preg_replace('/\s+/', '', $correctanswer)));

    return $useranswer === $correctanswer;
}
