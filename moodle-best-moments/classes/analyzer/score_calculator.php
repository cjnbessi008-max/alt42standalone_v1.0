<?php
/**
 * Score calculator for thinking moments
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_bestmoments\analyzer;

defined('MOODLE_INTERNAL') || die();

/**
 * Score Calculator - Calculates scores for each thinking moment
 */
class score_calculator {

    /**
     * Calculate moment score across all dimensions
     *
     * @param array $activity Activity data
     * @return array Scores array
     */
    public function calculate_moment_score($activity) {
        $scores = array();

        // Calculate individual dimension scores
        $scores['efficiency'] = $this->calculate_efficiency_score($activity);
        $scores['creativity'] = $this->calculate_creativity_score($activity);
        $scores['improvement'] = $this->calculate_improvement_score($activity);
        $scores['persistence'] = $this->calculate_persistence_score($activity);
        $scores['collaboration'] = $this->calculate_collaboration_score($activity);

        // Calculate weighted final score
        $scores['final_score'] = $this->calculate_final_score($scores);

        return $scores;
    }

    /**
     * Calculate efficiency score
     *
     * @param array $activity Activity data
     * @return float Efficiency score (0-100)
     */
    private function calculate_efficiency_score($activity) {
        $attempts = isset($activity['attempts']) ? $activity['attempts'] : 1;
        $time_spent = isset($activity['time_spent']) ? $activity['time_spent'] : 0;
        $success_rate = isset($activity['success_rate']) ? $activity['success_rate'] : 0;
        $expected_time = isset($activity['expected_time']) ? $activity['expected_time'] : 300; // 5 min default

        $max_attempts = 5;

        // Attempt efficiency: fewer attempts is better
        $attempt_score = max(0, (1 - ($attempts - 1) / $max_attempts)) * 0.5;

        // Time efficiency: faster is better (but not too fast)
        if ($time_spent > 0 && $expected_time > 0) {
            $time_ratio = $time_spent / $expected_time;
            // Optimal time is 0.5 to 1.0 of expected time
            if ($time_ratio < 0.5) {
                $time_score = $time_ratio * 0.6; // Too fast might indicate guessing
            } else if ($time_ratio <= 1.0) {
                $time_score = 0.3;
            } else {
                $time_score = max(0, 0.3 - ($time_ratio - 1.0) * 0.1);
            }
        } else {
            $time_score = 0.15; // Default mid-range score
        }

        // Success rate
        $success_score = $success_rate * 0.2;

        $total = ($attempt_score + $time_score + $success_score) * 100;

        return min(100, max(0, $total));
    }

    /**
     * Calculate creativity score
     *
     * @param array $activity Activity data
     * @return float Creativity score (0-100)
     */
    private function calculate_creativity_score($activity) {
        $unique_approach = isset($activity['unique_approach']) ? $activity['unique_approach'] : 0.5;
        $partial_credit = isset($activity['partial_credit_pattern']) ? $activity['partial_credit_pattern'] : 0;
        $alternative_solution = isset($activity['alternative_solution']) ? $activity['alternative_solution'] : 0;

        // Unique approach bonus (0-1)
        $unique_score = $unique_approach * 0.4;

        // Partial credit pattern (indicates step-by-step thinking)
        $partial_score = $partial_credit * 0.3;

        // Alternative solution attempts
        $alternative_score = $alternative_solution * 0.3;

        $total = ($unique_score + $partial_score + $alternative_score) * 100;

        return min(100, max(0, $total));
    }

    /**
     * Calculate improvement score
     *
     * @param array $activity Activity data
     * @return float Improvement score (0-100)
     */
    private function calculate_improvement_score($activity) {
        global $DB;

        $userid = $activity['userid'];
        $activitytype = $activity['type'];
        $current_grade = isset($activity['grade']) ? $activity['grade'] : 0;
        $current_time = isset($activity['time_spent']) ? $activity['time_spent'] : 0;

        // Get previous attempts
        $sql = "SELECT rawgrade, time_spent
                FROM {local_bestmoments_scores}
                WHERE userid = :userid
                  AND activitytype = :activitytype
                  AND timecreated < :current_time
                ORDER BY timecreated DESC
                LIMIT 5";

        $params = array(
            'userid' => $userid,
            'activitytype' => $activitytype,
            'current_time' => time()
        );

        $previous = $DB->get_records_sql($sql, $params);

        if (empty($previous)) {
            // No previous data, return baseline score
            return 50;
        }

        // Calculate average of previous attempts
        $prev_grades = array();
        $prev_times = array();

        foreach ($previous as $prev) {
            if (isset($prev->rawgrade)) {
                $prev_grades[] = $prev->rawgrade;
            }
            if (isset($prev->time_spent) && $prev->time_spent > 0) {
                $prev_times[] = $prev->time_spent;
            }
        }

        // Grade improvement
        if (!empty($prev_grades)) {
            $prev_avg_grade = array_sum($prev_grades) / count($prev_grades);
            if ($prev_avg_grade > 0) {
                $grade_improvement = ($current_grade - $prev_avg_grade) / $prev_avg_grade;
            } else {
                $grade_improvement = $current_grade > 0 ? 1 : 0;
            }
        } else {
            $grade_improvement = 0;
        }

        // Speed improvement
        if (!empty($prev_times) && $current_time > 0) {
            $prev_avg_time = array_sum($prev_times) / count($prev_times);
            $speed_improvement = ($prev_avg_time - $current_time) / $prev_avg_time;
        } else {
            $speed_improvement = 0;
        }

        // Consistency (lower standard deviation is better)
        if (count($prev_grades) > 1) {
            $std_dev = $this->calculate_std_deviation($prev_grades);
            $consistency = max(0, 1 - $std_dev / 100);
        } else {
            $consistency = 0.5;
        }

        // Weighted score
        $total = (
            max(-1, min(1, $grade_improvement)) * 0.5 +
            max(-1, min(1, $speed_improvement)) * 0.3 +
            $consistency * 0.2
        );

        // Normalize to 0-100
        $score = ($total + 1) / 2 * 100;

        return min(100, max(0, $score));
    }

    /**
     * Calculate persistence score
     *
     * @param array $activity Activity data
     * @return float Persistence score (0-100)
     */
    private function calculate_persistence_score($activity) {
        $retries = isset($activity['attempts']) ? $activity['attempts'] : 1;
        $time_invested = isset($activity['time_spent']) ? $activity['time_spent'] : 0;
        $difficulty = isset($activity['difficulty']) ? $activity['difficulty'] : 0.5;
        $final_success = isset($activity['success']) ? $activity['success'] : false;

        // Optimal retry range is 3-5
        $optimal_min = 3;
        $optimal_max = 5;

        if ($retries < $optimal_min) {
            $retry_score = $retries / $optimal_min;
        } else if ($retries <= $optimal_max) {
            $retry_score = 1.0;
        } else {
            $retry_score = max(0, 1 - ($retries - $optimal_max) / 10);
        }

        // Time investment (longer time on difficult problems is good)
        $expected_time = 300; // 5 minutes baseline
        $adjusted_expected = $expected_time * (1 + $difficulty);

        if ($time_invested > 0) {
            $time_ratio = min(1, $time_invested / $adjusted_expected);
            $time_score = $time_ratio;
        } else {
            $time_score = 0;
        }

        // Difficulty engagement
        $difficulty_score = $difficulty;

        // Final success bonus
        $success_bonus = $final_success ? 0.2 : 0;

        $total = (
            $retry_score * 0.4 +
            $time_score * 0.3 +
            $difficulty_score * 0.3 +
            $success_bonus
        ) * 100;

        return min(100, max(0, $total));
    }

    /**
     * Calculate collaboration score
     *
     * @param array $activity Activity data
     * @return float Collaboration score (0-100)
     */
    private function calculate_collaboration_score($activity) {
        // Only applicable for forum and group activities
        if (!in_array($activity['type'], array('forum', 'workshop', 'wiki'))) {
            return 0;
        }

        $helpful_replies = isset($activity['helpful_replies']) ? $activity['helpful_replies'] : 0;
        $discussions_started = isset($activity['discussions_started']) ? $activity['discussions_started'] : 0;
        $peer_engagement = isset($activity['peer_responses']) ? $activity['peer_responses'] : 0;

        // Normalize counts
        $replies_score = min(1, $helpful_replies / 5) * 0.4;
        $initiation_score = min(1, $discussions_started / 3) * 0.3;
        $engagement_score = min(1, $peer_engagement / 10) * 0.3;

        $total = ($replies_score + $initiation_score + $engagement_score) * 100;

        return min(100, max(0, $total));
    }

    /**
     * Calculate final weighted score
     *
     * @param array $scores Individual dimension scores
     * @return float Final score (0-100)
     */
    private function calculate_final_score($scores) {
        $final = (
            $scores['efficiency'] * BESTMOMENTS_WEIGHT_EFFICIENCY +
            $scores['creativity'] * BESTMOMENTS_WEIGHT_CREATIVITY +
            $scores['improvement'] * BESTMOMENTS_WEIGHT_IMPROVEMENT +
            $scores['persistence'] * BESTMOMENTS_WEIGHT_PERSISTENCE +
            $scores['collaboration'] * BESTMOMENTS_WEIGHT_COLLABORATION
        );

        return min(100, max(0, $final));
    }

    /**
     * Calculate standard deviation
     *
     * @param array $values Array of values
     * @return float Standard deviation
     */
    private function calculate_std_deviation($values) {
        $count = count($values);
        if ($count < 2) {
            return 0;
        }

        $mean = array_sum($values) / $count;
        $variance = 0;

        foreach ($values as $value) {
            $variance += pow($value - $mean, 2);
        }

        return sqrt($variance / $count);
    }
}
