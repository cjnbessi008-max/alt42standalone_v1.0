<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Engagement tracking business logic
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_engagementalert;

defined('MOODLE_INTERNAL') || die();

/**
 * Engagement tracker class
 */
class engagement_tracker {

    /**
     * Log engagement events
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @param array $events Array of events
     * @return bool Success status
     */
    public function log_events($userid, $courseid, $cmid, $events) {
        global $DB;

        if (empty($events)) {
            return true;
        }

        $sessionid = null;
        $records = [];

        foreach ($events as $event) {
            if (!isset($event['type']) || !isset($event['timestamp'])) {
                continue;
            }

            if (isset($event['sessionId'])) {
                $sessionid = $event['sessionId'];
            }

            $record = new \stdClass();
            $record->userid = $userid;
            $record->courseid = $courseid;
            $record->cmid = $cmid ?: null;
            $record->eventtype = clean_param($event['type'], PARAM_ALPHANUMEXT);
            $record->timestamp = $event['timestamp'];
            $record->sessionid = $sessionid ?: 'unknown';
            $record->metadata = isset($event['metadata']) ? json_encode($event['metadata']) : null;

            $records[] = $record;
        }

        // Bulk insert for performance
        if (!empty($records)) {
            try {
                $DB->insert_records('local_engagement_events', $records);

                // Update session record
                if ($sessionid) {
                    $this->update_session($userid, $courseid, $sessionid, count($records));
                }

                return true;
            } catch (\Exception $e) {
                debugging('Failed to log engagement events: ' . $e->getMessage());
                return false;
            }
        }

        return true;
    }

    /**
     * Update or create session record
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param string $sessionid Session ID
     * @param int $eventcount Number of events
     */
    protected function update_session($userid, $courseid, $sessionid, $eventcount) {
        global $DB;

        $session = $DB->get_record('local_engagement_sessions', ['sessionid' => $sessionid]);

        if ($session) {
            // Update existing session
            $session->total_events += $eventcount;
            $session->ended_at = time();
            $session->engagement_score = $this->calculate_engagement_score($sessionid);
            $DB->update_record('local_engagement_sessions', $session);
        } else {
            // Create new session
            $session = new \stdClass();
            $session->userid = $userid;
            $session->courseid = $courseid;
            $session->sessionid = $sessionid;
            $session->started_at = time();
            $session->ended_at = time();
            $session->total_events = $eventcount;
            $session->total_alerts = 0;
            $session->engagement_score = 100.0;
            $DB->insert_record('local_engagement_sessions', $session);
        }
    }

    /**
     * Calculate engagement score for a session
     *
     * @param string $sessionid Session ID
     * @return float Engagement score (0-100)
     */
    protected function calculate_engagement_score($sessionid) {
        global $DB;

        $session = $DB->get_record('local_engagement_sessions', ['sessionid' => $sessionid]);
        if (!$session) {
            return 100.0;
        }

        $duration = $session->ended_at - $session->started_at;
        if ($duration <= 0) {
            return 100.0;
        }

        // Get alert count
        $alertcount = $DB->count_records('local_engagement_alerts', ['sessionid' => $sessionid]);

        // Get event count
        $eventcount = $session->total_events;

        // Calculate score based on:
        // 1. Events per minute (higher is better)
        // 2. Alert count (lower is better)
        $durationMinutes = max(1, $duration / 60);
        $eventsPerMinute = $eventcount / $durationMinutes;

        // Normalize events per minute (assuming 5-20 is ideal range)
        $eventScore = min(100, ($eventsPerMinute / 20) * 100);

        // Penalty for alerts (each alert reduces score by 10 points)
        $alertPenalty = min(50, $alertcount * 10);

        $score = max(0, $eventScore - $alertPenalty);

        return round($score, 2);
    }

    /**
     * Get session summary
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $limit Number of sessions to retrieve
     * @return array Array of session records
     */
    public function get_user_sessions($userid, $courseid, $limit = 10) {
        global $DB;

        $sql = "SELECT * FROM {local_engagement_sessions}
                WHERE userid = :userid AND courseid = :courseid
                ORDER BY started_at DESC";

        return $DB->get_records_sql($sql, ['userid' => $userid, 'courseid' => $courseid], 0, $limit);
    }

    /**
     * Get engagement statistics for a course
     *
     * @param int $courseid Course ID
     * @param int $starttime Start timestamp
     * @param int $endtime End timestamp
     * @return array Statistics
     */
    public function get_course_statistics($courseid, $starttime = 0, $endtime = 0) {
        global $DB;

        if (!$endtime) {
            $endtime = time();
        }
        if (!$starttime) {
            $starttime = $endtime - (7 * 24 * 60 * 60); // Last 7 days
        }

        $stats = [];

        // Total sessions
        $stats['total_sessions'] = $DB->count_records_select(
            'local_engagement_sessions',
            'courseid = :courseid AND started_at BETWEEN :start AND :end',
            ['courseid' => $courseid, 'start' => $starttime, 'end' => $endtime]
        );

        // Total alerts
        $stats['total_alerts'] = $DB->count_records_select(
            'local_engagement_alerts',
            'courseid = :courseid AND detected_at BETWEEN :start AND :end',
            ['courseid' => $courseid, 'start' => $starttime, 'end' => $endtime]
        );

        // Average engagement score
        $sql = "SELECT AVG(engagement_score) as avg_score
                FROM {local_engagement_sessions}
                WHERE courseid = :courseid AND started_at BETWEEN :start AND :end";
        $result = $DB->get_record_sql($sql, ['courseid' => $courseid, 'start' => $starttime, 'end' => $endtime]);
        $stats['avg_engagement_score'] = $result ? round($result->avg_score, 2) : 0;

        // Most common alert type
        $sql = "SELECT alerttype, COUNT(*) as count
                FROM {local_engagement_alerts}
                WHERE courseid = :courseid AND detected_at BETWEEN :start AND :end
                GROUP BY alerttype
                ORDER BY count DESC";
        $alerttypes = $DB->get_records_sql($sql, ['courseid' => $courseid, 'start' => $starttime, 'end' => $endtime], 0, 1);
        $stats['most_common_alert'] = !empty($alerttypes) ? reset($alerttypes)->alerttype : 'none';

        return $stats;
    }
}
