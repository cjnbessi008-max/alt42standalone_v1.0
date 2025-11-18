<?php
/**
 * Next Term Vision - Moodle Activity Module
 * Library of interface functions and constants
 *
 * @package    mod_nextterm
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Given an object containing all the necessary data,
 * will create a new instance and return the id number
 *
 * @param object $nextterm An object from the form in mod_form.php
 * @return int The id of the newly inserted nextterm record
 */
function nextterm_add_instance($nextterm) {
    global $DB;

    $nextterm->timecreated = time();
    $nextterm->timemodified = time();

    $nextterm->id = $DB->insert_record('nextterm', $nextterm);

    return $nextterm->id;
}

/**
 * Given an object containing all the necessary data,
 * will update an existing instance with new data.
 *
 * @param object $nextterm An object from the form in mod_form.php
 * @return boolean Success/Fail
 */
function nextterm_update_instance($nextterm) {
    global $DB;

    $nextterm->timemodified = time();
    $nextterm->id = $nextterm->instance;

    return $DB->update_record('nextterm', $nextterm);
}

/**
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function nextterm_delete_instance($id) {
    global $DB;

    if (!$nextterm = $DB->get_record('nextterm', array('id' => $id))) {
        return false;
    }

    // Delete all related responses
    $DB->delete_records('nextterm_responses', array('nextterm_id' => $id));

    // Delete the instance itself
    $DB->delete_records('nextterm', array('id' => $id));

    return true;
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 *
 * @param object $course
 * @param object $user
 * @param object $mod
 * @param object $nextterm
 * @return object|null
 */
function nextterm_user_outline($course, $user, $mod, $nextterm) {
    global $DB;

    $sql = "SELECT COUNT(*) as attempts,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM {nextterm_responses}
            WHERE student_id = :userid";

    $result = $DB->get_record_sql($sql, array('userid' => $user->id));

    if ($result && $result->attempts > 0) {
        $return = new stdClass();
        $return->info = get_string('attempts', 'mod_nextterm', $result->attempts);
        $accuracy = round(($result->correct / $result->attempts) * 100, 1);
        $return->info .= ' (' . $accuracy . '% ' . get_string('correct', 'mod_nextterm') . ')';
        return $return;
    }

    return null;
}

/**
 * Print a detailed representation of what a user has done with
 * a given particular instance of this module, for user activity reports.
 *
 * @param object $course
 * @param object $user
 * @param object $mod
 * @param object $nextterm
 */
function nextterm_user_complete($course, $user, $mod, $nextterm) {
    global $DB;

    $sql = "SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                AVG(time_spent_seconds) as avg_time,
                MAX(submitted_at) as last_attempt
            FROM {nextterm_responses}
            WHERE student_id = :userid";

    $stats = $DB->get_record_sql($sql, array('userid' => $user->id));

    if ($stats && $stats->total_attempts > 0) {
        echo '<div class="nextterm-user-stats">';
        echo '<p><strong>' . get_string('totalattempts', 'mod_nextterm') . ':</strong> ' . $stats->total_attempts . '</p>';
        echo '<p><strong>' . get_string('correctanswers', 'mod_nextterm') . ':</strong> ' . $stats->correct_answers . '</p>';

        $accuracy = round(($stats->correct_answers / $stats->total_attempts) * 100, 1);
        echo '<p><strong>' . get_string('accuracy', 'mod_nextterm') . ':</strong> ' . $accuracy . '%</p>';

        if ($stats->avg_time) {
            echo '<p><strong>' . get_string('avgtime', 'mod_nextterm') . ':</strong> ' .
                 round($stats->avg_time) . ' ' . get_string('seconds', 'mod_nextterm') . '</p>';
        }

        if ($stats->last_attempt) {
            echo '<p><strong>' . get_string('lastattempt', 'mod_nextterm') . ':</strong> ' .
                 userdate($stats->last_attempt) . '</p>';
        }
        echo '</div>';
    } else {
        echo '<p>' . get_string('noattempts', 'mod_nextterm') . '</p>';
    }
}

/**
 * This function is used by the reset_course_userdata function in moodlelib.
 *
 * @param object $data the data submitted from the reset course.
 * @return array status array
 */
function nextterm_reset_userdata($data) {
    global $DB;

    $componentstr = get_string('modulenameplural', 'mod_nextterm');
    $status = array();

    if (!empty($data->reset_nextterm_responses)) {
        $sql = "DELETE FROM {nextterm_responses}
                WHERE problem_id IN (
                    SELECT id FROM {nextterm_problems}
                )";
        $DB->execute($sql);

        $status[] = array(
            'component' => $componentstr,
            'item' => get_string('removeresponses', 'mod_nextterm'),
            'error' => false
        );
    }

    return $status;
}

/**
 * Returns all other caps used in module
 *
 * @return array
 */
function nextterm_get_extra_capabilities() {
    return array('moodle/site:accessallgroups');
}

/**
 * Supported features
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function nextterm_supports($feature) {
    switch($feature) {
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return false;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        default:
            return null;
    }
}
