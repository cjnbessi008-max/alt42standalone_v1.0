<?php
// This file is part of Moodle - http://moodle.org/

/**
 * API endpoints for Slope Heatmap
 *
 * @package    mod_slopeheatmap
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_slopeheatmap;

defined('MOODLE_INTERNAL') || die();

class api {

    /**
     * Start a new session
     *
     * @param int $cmid Course module ID
     * @param int $userid User ID
     * @param string $problemid Problem identifier
     * @return array Session information
     */
    public static function start_session($cmid, $userid, $problemid) {
        global $DB;

        $cm = get_coursemodule_from_id('slopeheatmap', $cmid, 0, false, MUST_EXIST);
        $slopeheatmap = $DB->get_record('slopeheatmap', array('id' => $cm->instance), '*', MUST_EXIST);

        // Check if problem exists
        $problem = $DB->get_record('slopeheatmap_problems',
            array('slopeheatmap_id' => $slopeheatmap->id, 'problem_key' => $problemid));

        if (!$problem) {
            throw new \moodle_exception('error:problemnotfound', 'mod_slopeheatmap');
        }

        // Create new session
        $session = new \stdClass();
        $session->slopeheatmap_id = $slopeheatmap->id;
        $session->user_id = $userid;
        $session->problem_id = $problemid;
        $session->session_start = time();
        $session->completed = 0;

        $session->id = $DB->insert_record('slopeheatmap_sessions', $session);

        return array(
            'success' => true,
            'session_id' => $session->id,
            'problem' => array(
                'title' => $problem->title,
                'description' => $problem->description,
                'target_beta_min' => $problem->target_beta_min,
                'target_beta_max' => $problem->target_beta_max,
                'target_gamma_min' => $problem->target_gamma_min,
                'target_gamma_max' => $problem->target_gamma_max,
                'time_limit' => $problem->time_limit,
                'difficulty' => $problem->difficulty
            )
        );
    }

    /**
     * Save sensor data
     *
     * @param int $sessionid Session ID
     * @param array $sensordata Array of sensor readings
     * @return array Result
     */
    public static function save_sensor_data($sessionid, $sensordata) {
        global $DB;

        $session = $DB->get_record('slopeheatmap_sessions', array('id' => $sessionid));
        if (!$session) {
            throw new \moodle_exception('error:sessionnotfound', 'mod_slopeheatmap');
        }

        $records = array();
        foreach ($sensordata as $data) {
            $record = new \stdClass();
            $record->session_id = $sessionid;
            $record->timestamp = $data['timestamp'];
            $record->alpha = $data['alpha'];
            $record->beta = $data['beta'];
            $record->gamma = $data['gamma'];
            $record->absolute = isset($data['absolute']) ? $data['absolute'] : 1;
            $records[] = $record;
        }

        $DB->insert_records('slopeheatmap_sensor_data', $records);

        // Update aggregated data
        self::update_aggregated_data($sessionid);

        return array('success' => true, 'saved' => count($records));
    }

    /**
     * Update aggregated heatmap data
     *
     * @param int $sessionid Session ID
     */
    private static function update_aggregated_data($sessionid) {
        global $DB;

        // Grid size for aggregation (5 degree bins)
        $bin_size = 5;

        // Get all sensor data for this session
        $sql = "SELECT FLOOR(beta / :binsize1) * :binsize2 as beta_bin,
                       FLOOR(gamma / :binsize3) * :binsize4 as gamma_bin,
                       COUNT(*) as count,
                       MAX(timestamp) - MIN(timestamp) as duration_ms
                FROM {slopeheatmap_sensor_data}
                WHERE session_id = :sessionid
                GROUP BY beta_bin, gamma_bin";

        $params = array(
            'binsize1' => $bin_size,
            'binsize2' => $bin_size,
            'binsize3' => $bin_size,
            'binsize4' => $bin_size,
            'sessionid' => $sessionid
        );

        $aggregates = $DB->get_records_sql($sql, $params);

        // Delete old aggregated data
        $DB->delete_records('slopeheatmap_aggregated', array('session_id' => $sessionid));

        // Insert new aggregated data
        foreach ($aggregates as $agg) {
            $record = new \stdClass();
            $record->session_id = $sessionid;
            $record->beta_range_start = $agg->beta_bin;
            $record->beta_range_end = $agg->beta_bin + $bin_size;
            $record->gamma_range_start = $agg->gamma_bin;
            $record->gamma_range_end = $agg->gamma_bin + $bin_size;
            $record->count = $agg->count;
            $record->duration_ms = $agg->duration_ms;

            $DB->insert_record('slopeheatmap_aggregated', $record);
        }
    }

    /**
     * Complete a session
     *
     * @param int $sessionid Session ID
     * @param float $score Score (0-100)
     * @return array Result
     */
    public static function complete_session($sessionid, $score) {
        global $DB;

        $session = $DB->get_record('slopeheatmap_sessions', array('id' => $sessionid));
        if (!$session) {
            throw new \moodle_exception('error:sessionnotfound', 'mod_slopeheatmap');
        }

        $session->session_end = time();
        $session->completed = 1;
        $session->score = $score;

        $DB->update_record('slopeheatmap_sessions', $session);

        // Update gradebook
        $slopeheatmap = $DB->get_record('slopeheatmap', array('id' => $session->slopeheatmap_id));
        slopeheatmap_update_grades($slopeheatmap, $session->user_id);

        return array('success' => true, 'score' => $score);
    }

    /**
     * Get heatmap data for a session
     *
     * @param int $sessionid Session ID
     * @return array Heatmap data
     */
    public static function get_heatmap_data($sessionid) {
        global $DB;

        $aggregates = $DB->get_records('slopeheatmap_aggregated', array('session_id' => $sessionid));

        $heatmap = array();
        foreach ($aggregates as $agg) {
            $heatmap[] = array(
                'beta_start' => $agg->beta_range_start,
                'beta_end' => $agg->beta_range_end,
                'gamma_start' => $agg->gamma_range_start,
                'gamma_end' => $agg->gamma_range_end,
                'count' => $agg->count,
                'duration_ms' => $agg->duration_ms
            );
        }

        return array('success' => true, 'heatmap' => $heatmap);
    }

    /**
     * Get problems for an activity
     *
     * @param int $cmid Course module ID
     * @return array Problems
     */
    public static function get_problems($cmid) {
        global $DB;

        $cm = get_coursemodule_from_id('slopeheatmap', $cmid, 0, false, MUST_EXIST);
        $slopeheatmap = $DB->get_record('slopeheatmap', array('id' => $cm->instance), '*', MUST_EXIST);

        $problems = $DB->get_records('slopeheatmap_problems', array('slopeheatmap_id' => $slopeheatmap->id));

        $result = array();
        foreach ($problems as $problem) {
            $result[] = array(
                'id' => $problem->id,
                'key' => $problem->problem_key,
                'title' => $problem->title,
                'description' => $problem->description,
                'difficulty' => $problem->difficulty
            );
        }

        return array('success' => true, 'problems' => $result);
    }
}
