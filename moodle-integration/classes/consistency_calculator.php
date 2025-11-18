<?php
/**
 * Consistency Score Calculator for Thinking Routines
 *
 * This class implements the algorithm to calculate how consistently
 * students apply thinking routines in their learning activities.
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_thinkroutine_consistency;

defined('MOODLE_INTERNAL') || die();

class consistency_calculator {

    /**
     * Calculate consistency score for a student's thinking routine usage
     *
     * Algorithm:
     * 1. Frequency Score: How often the pattern is used (0-100)
     * 2. Adherence Score: How well the pattern steps are followed (0-100)
     * 3. Consistency Index: Standard deviation of pattern usage over time (0-100)
     * 4. Final Score: Weighted average of the three components
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $patternid Thinking routine pattern ID
     * @param int $periodstart Start timestamp for calculation period
     * @param int $periodend End timestamp for calculation period
     * @return array Consistency score data
     */
    public static function calculate_score($userid, $courseid, $patternid, $periodstart, $periodend) {
        global $DB;

        // Get pattern definition
        $pattern = $DB->get_record('block_trc_patterns', ['id' => $patternid], '*', MUST_EXIST);

        // Get all activities for this user, course, and pattern in the period
        $activities = $DB->get_records_sql(
            "SELECT * FROM {block_trc_activities}
             WHERE userid = :userid
             AND courseid = :courseid
             AND patternid = :patternid
             AND timecreated >= :periodstart
             AND timecreated <= :periodend
             ORDER BY timecreated ASC",
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'patternid' => $patternid,
                'periodstart' => $periodstart,
                'periodend' => $periodend
            ]
        );

        if (empty($activities)) {
            return [
                'score' => 0.0,
                'frequency' => 0,
                'adherence_rate' => 0.0,
                'consistency_index' => 0.0
            ];
        }

        // Calculate frequency score
        $frequency = count($activities);
        $frequency_score = self::calculate_frequency_score($frequency, $periodstart, $periodend);

        // Calculate adherence score (how well steps are followed)
        $adherence_score = self::calculate_adherence_score($activities, $pattern);

        // Calculate consistency index (regularity over time)
        $consistency_index = self::calculate_consistency_index($activities, $periodstart, $periodend);

        // Calculate final weighted score
        $final_score = (
            $frequency_score * 0.3 +
            $adherence_score * 0.5 +
            $consistency_index * 0.2
        );

        return [
            'score' => round($final_score, 2),
            'frequency' => $frequency,
            'adherence_rate' => round($adherence_score, 2),
            'consistency_index' => round($consistency_index, 2)
        ];
    }

    /**
     * Calculate frequency score based on usage count
     *
     * @param int $frequency Number of times pattern was used
     * @param int $periodstart Start of period
     * @param int $periodend End of period
     * @return float Score 0-100
     */
    private static function calculate_frequency_score($frequency, $periodstart, $periodend) {
        $days = max(1, ($periodend - $periodstart) / 86400);
        $uses_per_day = $frequency / $days;

        // Normalize: 1+ uses per day = 100 score
        // 0.5 uses per day = 50 score
        // Linear scale up to max
        $score = min(100, $uses_per_day * 100);

        return $score;
    }

    /**
     * Calculate adherence score (how well the pattern steps are followed)
     *
     * @param array $activities Array of activity records
     * @param object $pattern Pattern definition
     * @return float Score 0-100
     */
    private static function calculate_adherence_score($activities, $pattern) {
        if (empty($pattern->expected_steps)) {
            return 100.0; // No defined steps means full adherence
        }

        $expected_steps = json_decode($pattern->expected_steps, true);
        if (empty($expected_steps)) {
            return 100.0;
        }

        $total_adherence = 0;
        $session_count = 0;

        // Group activities by session (within 30 minutes of each other)
        $sessions = self::group_activities_into_sessions($activities, 1800);

        foreach ($sessions as $session) {
            $session_adherence = self::calculate_session_adherence($session, $expected_steps);
            $total_adherence += $session_adherence;
            $session_count++;
        }

        return $session_count > 0 ? ($total_adherence / $session_count) : 0.0;
    }

    /**
     * Group activities into sessions based on time gaps
     *
     * @param array $activities Sorted activities
     * @param int $gap_threshold Max gap in seconds between activities in same session
     * @return array Array of sessions (each session is an array of activities)
     */
    private static function group_activities_into_sessions($activities, $gap_threshold) {
        $sessions = [];
        $current_session = [];
        $last_time = 0;

        foreach ($activities as $activity) {
            if ($last_time > 0 && ($activity->timecreated - $last_time) > $gap_threshold) {
                // Start new session
                if (!empty($current_session)) {
                    $sessions[] = $current_session;
                }
                $current_session = [];
            }
            $current_session[] = $activity;
            $last_time = $activity->timecreated;
        }

        // Add final session
        if (!empty($current_session)) {
            $sessions[] = $current_session;
        }

        return $sessions;
    }

    /**
     * Calculate adherence for a single session
     *
     * @param array $session Array of activities in the session
     * @param array $expected_steps Expected steps in order
     * @return float Adherence score 0-100
     */
    private static function calculate_session_adherence($session, $expected_steps) {
        $session_actions = array_map(function($activity) {
            return $activity->action;
        }, $session);

        // Use Longest Common Subsequence (LCS) algorithm
        $lcs_length = self::longest_common_subsequence($session_actions, $expected_steps);
        $max_length = max(count($session_actions), count($expected_steps));

        if ($max_length == 0) {
            return 100.0;
        }

        return ($lcs_length / $max_length) * 100;
    }

    /**
     * Calculate Longest Common Subsequence length
     *
     * @param array $arr1 First array
     * @param array $arr2 Second array
     * @return int Length of LCS
     */
    private static function longest_common_subsequence($arr1, $arr2) {
        $m = count($arr1);
        $n = count($arr2);

        $lcs = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));

        for ($i = 1; $i <= $m; $i++) {
            for ($j = 1; $j <= $n; $j++) {
                if ($arr1[$i - 1] == $arr2[$j - 1]) {
                    $lcs[$i][$j] = $lcs[$i - 1][$j - 1] + 1;
                } else {
                    $lcs[$i][$j] = max($lcs[$i - 1][$j], $lcs[$i][$j - 1]);
                }
            }
        }

        return $lcs[$m][$n];
    }

    /**
     * Calculate consistency index (regularity of pattern usage over time)
     *
     * @param array $activities Array of activity records
     * @param int $periodstart Start of period
     * @param int $periodend End of period
     * @return float Score 0-100
     */
    private static function calculate_consistency_index($activities, $periodstart, $periodend) {
        if (count($activities) < 2) {
            return 100.0; // Not enough data, assume consistent
        }

        $total_days = max(1, ($periodend - $periodstart) / 86400);
        $days_with_activity = [];

        // Count activities per day
        foreach ($activities as $activity) {
            $day = floor($activity->timecreated / 86400);
            if (!isset($days_with_activity[$day])) {
                $days_with_activity[$day] = 0;
            }
            $days_with_activity[$day]++;
        }

        // Calculate coefficient of variation (lower is more consistent)
        $counts = array_values($days_with_activity);
        $mean = array_sum($counts) / count($counts);

        if ($mean == 0) {
            return 100.0;
        }

        $variance = 0;
        foreach ($counts as $count) {
            $variance += pow($count - $mean, 2);
        }
        $variance /= count($counts);
        $std_dev = sqrt($variance);

        $coefficient_of_variation = ($std_dev / $mean);

        // Convert CV to score: CV of 0 = 100, CV of 1 = 50, CV of 2+ = 0
        $score = max(0, 100 - ($coefficient_of_variation * 50));

        // Bonus for daily consistency
        $days_active = count($days_with_activity);
        $daily_consistency_bonus = ($days_active / $total_days) * 20;

        return min(100, $score + $daily_consistency_bonus);
    }

    /**
     * Get overall consistency score across all patterns for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $periodstart Start timestamp
     * @param int $periodend End timestamp
     * @return float Overall score 0-100
     */
    public static function get_overall_score($userid, $courseid, $periodstart, $periodend) {
        global $DB;

        $patterns = $DB->get_records('block_trc_patterns');
        if (empty($patterns)) {
            return 0.0;
        }

        $weighted_sum = 0;
        $total_weight = 0;

        foreach ($patterns as $pattern) {
            $score_data = self::calculate_score($userid, $courseid, $pattern->id, $periodstart, $periodend);
            $weighted_sum += $score_data['score'] * $pattern->weight;
            $total_weight += $pattern->weight;
        }

        return $total_weight > 0 ? round($weighted_sum / $total_weight, 2) : 0.0;
    }

    /**
     * Update stored scores for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $periodstart Start timestamp
     * @param int $periodend End timestamp
     * @return bool Success status
     */
    public static function update_scores($userid, $courseid, $periodstart, $periodend) {
        global $DB;

        $patterns = $DB->get_records('block_trc_patterns');
        $time = time();

        foreach ($patterns as $pattern) {
            $score_data = self::calculate_score($userid, $courseid, $pattern->id, $periodstart, $periodend);

            // Check if score record exists
            $existing = $DB->get_record('block_trc_scores', [
                'userid' => $userid,
                'courseid' => $courseid,
                'patternid' => $pattern->id,
                'period_start' => $periodstart,
                'period_end' => $periodend
            ]);

            $record = new \stdClass();
            $record->userid = $userid;
            $record->courseid = $courseid;
            $record->patternid = $pattern->id;
            $record->score = $score_data['score'];
            $record->frequency = $score_data['frequency'];
            $record->adherence_rate = $score_data['adherence_rate'];
            $record->consistency_index = $score_data['consistency_index'];
            $record->period_start = $periodstart;
            $record->period_end = $periodend;
            $record->timemodified = $time;

            if ($existing) {
                $record->id = $existing->id;
                $DB->update_record('block_trc_scores', $record);
            } else {
                $record->timecreated = $time;
                $DB->insert_record('block_trc_scores', $record);
            }
        }

        return true;
    }
}
