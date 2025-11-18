<?php
/**
 * Library of interface functions and constants for module bestmoments
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/bestmoments/config/config.php');
require_once($CFG->dirroot . '/local/bestmoments/config/database.php');

/**
 * Main entry point for scheduled task
 *
 * @return bool Success status
 */
function local_bestmoments_cron() {
    global $DB;

    mtrace('Starting Best Moments Analysis...');

    try {
        $analyzer = new \local_bestmoments\analyzer\moment_analyzer();
        $result = $analyzer->run_daily_analysis();

        mtrace("Analysis completed: {$result['moments_extracted']} moments extracted");

        return true;
    } catch (Exception $e) {
        mtrace("Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get best moments for a specific user
 *
 * @param int $userid User ID
 * @param int $limit Maximum number of moments to return
 * @param int $days Number of days to look back (default: 7)
 * @return array Array of moment objects
 */
function local_bestmoments_get_user_moments($userid, $limit = 10, $days = 7) {
    global $DB;

    $timestart = time() - ($days * 86400);

    $sql = "SELECT *
            FROM {local_bestmoments_moments}
            WHERE userid = :userid
              AND momentdate >= :timestart
            ORDER BY score DESC, momentdate DESC
            LIMIT :limit";

    $params = array(
        'userid' => $userid,
        'timestart' => $timestart,
        'limit' => $limit
    );

    return $DB->get_records_sql($sql, $params);
}

/**
 * Get best moments for a course
 *
 * @param int $courseid Course ID
 * @param int $limit Maximum number of moments
 * @param int $days Number of days to look back
 * @return array Array of moment objects
 */
function local_bestmoments_get_course_moments($courseid, $limit = 10, $days = 7) {
    global $DB;

    $timestart = time() - ($days * 86400);

    $sql = "SELECT m.*, u.firstname, u.lastname, u.email
            FROM {local_bestmoments_moments} m
            JOIN {user} u ON u.id = m.userid
            WHERE m.courseid = :courseid
              AND m.momentdate >= :timestart
            ORDER BY m.score DESC, m.momentdate DESC
            LIMIT :limit";

    $params = array(
        'courseid' => $courseid,
        'timestart' => $timestart,
        'limit' => $limit
    );

    return $DB->get_records_sql($sql, $params);
}

/**
 * Get today's best moments (featured)
 *
 * @param int $limit Maximum number of moments
 * @return array Array of featured moment objects
 */
function local_bestmoments_get_todays_featured($limit = 10) {
    global $DB;

    $today_start = strtotime('today');
    $today_end = strtotime('tomorrow');

    $sql = "SELECT m.*, u.firstname, u.lastname, c.fullname as coursename
            FROM {local_bestmoments_moments} m
            JOIN {user} u ON u.id = m.userid
            JOIN {course} c ON c.id = m.courseid
            WHERE m.momentdate >= :today_start
              AND m.momentdate < :today_end
              AND m.is_featured = 1
            ORDER BY m.score DESC
            LIMIT :limit";

    $params = array(
        'today_start' => $today_start,
        'today_end' => $today_end,
        'limit' => $limit
    );

    return $DB->get_records_sql($sql, $params);
}

/**
 * Check if user can view moments
 *
 * @param int $courseid Course ID
 * @param int $userid User ID (optional, defaults to current user)
 * @return bool True if user has permission
 */
function local_bestmoments_can_view($courseid, $userid = null) {
    global $USER;

    if ($userid === null) {
        $userid = $USER->id;
    }

    $context = context_course::instance($courseid);

    // Teachers and managers can view all
    if (has_capability('local/bestmoments:viewreport', $context)) {
        return true;
    }

    // Students can view their own
    if (has_capability('local/bestmoments:viewown', $context) && $userid == $USER->id) {
        return true;
    }

    return false;
}

/**
 * Trigger manual analysis for a course
 *
 * @param int $courseid Course ID
 * @return array Result with status and message
 */
function local_bestmoments_trigger_analysis($courseid) {
    $context = context_course::instance($courseid);

    if (!has_capability('local/bestmoments:triggeranalysis', $context)) {
        return array(
            'success' => false,
            'message' => get_string('nopermission', 'local_bestmoments')
        );
    }

    try {
        $analyzer = new \local_bestmoments\analyzer\moment_analyzer();
        $result = $analyzer->analyze_course($courseid);

        return array(
            'success' => true,
            'message' => get_string('analysissuccess', 'local_bestmoments'),
            'moments_found' => $result['moments_extracted']
        );
    } catch (Exception $e) {
        return array(
            'success' => false,
            'message' => $e->getMessage()
        );
    }
}

/**
 * Get statistics for dashboard
 *
 * @param int $courseid Course ID (optional)
 * @return array Statistics array
 */
function local_bestmoments_get_statistics($courseid = null) {
    global $DB;

    $stats = array();

    // Total moments
    if ($courseid) {
        $stats['total_moments'] = $DB->count_records('local_bestmoments_moments',
            array('courseid' => $courseid));
    } else {
        $stats['total_moments'] = $DB->count_records('local_bestmoments_moments');
    }

    // Today's moments
    $today_start = strtotime('today');
    $today_end = strtotime('tomorrow');

    $sql = "SELECT COUNT(*) FROM {local_bestmoments_moments}
            WHERE momentdate >= :today_start
              AND momentdate < :today_end";

    $params = array('today_start' => $today_start, 'today_end' => $today_end);

    if ($courseid) {
        $sql .= " AND courseid = :courseid";
        $params['courseid'] = $courseid;
    }

    $stats['today_moments'] = $DB->count_records_sql($sql, $params);

    // Average score
    $sql = "SELECT AVG(score) as avg_score FROM {local_bestmoments_moments}";

    if ($courseid) {
        $sql .= " WHERE courseid = :courseid";
        $params = array('courseid' => $courseid);
        $result = $DB->get_record_sql($sql, $params);
    } else {
        $result = $DB->get_record_sql($sql);
    }

    $stats['average_score'] = $result ? round($result->avg_score, 2) : 0;

    // Most active students
    $sql = "SELECT userid, COUNT(*) as moment_count
            FROM {local_bestmoments_moments}";

    if ($courseid) {
        $sql .= " WHERE courseid = :courseid";
        $params = array('courseid' => $courseid);
    } else {
        $params = array();
    }

    $sql .= " GROUP BY userid ORDER BY moment_count DESC LIMIT 5";

    $stats['top_students'] = $DB->get_records_sql($sql, $params);

    return $stats;
}
