<?php
/**
 * Activity Tracker for Thinking Routines
 *
 * Tracks student activities and matches them to thinking routine patterns
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_thinkroutine_consistency;

defined('MOODLE_INTERNAL') || die();

class activity_tracker {

    /**
     * Track a student activity
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @param string $activitytype Type of activity
     * @param string $action Action taken
     * @param array $actiondata Additional data about the action
     * @return int Activity record ID
     */
    public static function track_activity($userid, $courseid, $cmid, $activitytype, $action, $actiondata = []) {
        global $DB;

        // Try to match this action to a thinking routine pattern
        $patternid = self::match_pattern($action, $actiondata);

        // Get the sequence order (count of activities in this session)
        $session_start = time() - 1800; // Last 30 minutes
        $sequence_order = $DB->count_records_select(
            'block_trc_activities',
            'userid = :userid AND courseid = :courseid AND timecreated >= :sessionstart',
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'sessionstart' => $session_start
            ]
        );

        $record = new \stdClass();
        $record->userid = $userid;
        $record->courseid = $courseid;
        $record->cmid = $cmid;
        $record->activitytype = $activitytype;
        $record->action = $action;
        $record->actiondata = json_encode($actiondata);
        $record->patternid = $patternid;
        $record->sequence_order = $sequence_order;
        $record->timecreated = time();

        $id = $DB->insert_record('block_trc_activities', $record);

        // Update session record
        self::update_session($userid, $courseid);

        return $id;
    }

    /**
     * Match an action to a thinking routine pattern
     *
     * @param string $action Action name
     * @param array $actiondata Action data
     * @return int|null Pattern ID or null
     */
    private static function match_pattern($action, $actiondata) {
        global $DB;

        // Get all patterns and try to match
        $patterns = $DB->get_records('block_trc_patterns');

        foreach ($patterns as $pattern) {
            if (empty($pattern->expected_steps)) {
                continue;
            }

            $expected_steps = json_decode($pattern->expected_steps, true);
            if (in_array($action, $expected_steps)) {
                return $pattern->id;
            }
        }

        return null;
    }

    /**
     * Update or create session record
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return void
     */
    private static function update_session($userid, $courseid) {
        global $DB;

        $session_timeout = 1800; // 30 minutes
        $time = time();

        // Check for active session
        $session = $DB->get_record_sql(
            "SELECT * FROM {block_trc_sessions}
             WHERE userid = :userid
             AND courseid = :courseid
             AND (session_end IS NULL OR session_end > :timeout)
             ORDER BY session_start DESC
             LIMIT 1",
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'timeout' => $time - $session_timeout
            ]
        );

        if ($session) {
            // Update existing session
            $session->session_end = $time;
            $session->total_actions++;

            // Get patterns used in this session
            $activities = $DB->get_records_select(
                'block_trc_activities',
                'userid = :userid AND courseid = :courseid AND timecreated >= :sessionstart',
                [
                    'userid' => $userid,
                    'courseid' => $courseid,
                    'sessionstart' => $session->session_start
                ]
            );

            $patterns_used = [];
            foreach ($activities as $activity) {
                if ($activity->patternid) {
                    $patterns_used[$activity->patternid] = true;
                }
            }

            $session->patterns_used = json_encode(array_keys($patterns_used));

            $DB->update_record('block_trc_sessions', $session);
        } else {
            // Create new session
            $session = new \stdClass();
            $session->userid = $userid;
            $session->courseid = $courseid;
            $session->session_start = $time;
            $session->session_end = $time;
            $session->total_actions = 1;
            $session->patterns_used = json_encode([]);
            $session->session_score = 0.0;
            $session->timecreated = $time;

            $DB->insert_record('block_trc_sessions', $session);
        }
    }

    /**
     * Get recent activities for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $limit Number of activities to retrieve
     * @return array Array of activity records
     */
    public static function get_recent_activities($userid, $courseid, $limit = 20) {
        global $DB;

        return $DB->get_records_sql(
            "SELECT a.*, p.name as pattern_name, p.category as pattern_category
             FROM {block_trc_activities} a
             LEFT JOIN {block_trc_patterns} p ON a.patternid = p.id
             WHERE a.userid = :userid AND a.courseid = :courseid
             ORDER BY a.timecreated DESC
             LIMIT :limit",
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'limit' => $limit
            ]
        );
    }
}
