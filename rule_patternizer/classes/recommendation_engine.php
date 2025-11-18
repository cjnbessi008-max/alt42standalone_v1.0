<?php
// This file is part of Rule Patternizer

namespace mod_rulepatternizer;

defined('MOODLE_INTERNAL') || die();

/**
 * Adaptive Learning Recommendation Engine
 *
 * This class implements an intelligent recommendation system that:
 * - Analyzes user learning patterns
 * - Adjusts difficulty based on performance
 * - Implements spaced repetition algorithm
 * - Recommends optimal next problems
 */
class recommendation_engine {

    /** @var int User ID */
    private $userid;

    /** @var int Activity instance ID */
    private $instanceid;

    /** @var object Database connection */
    private $db;

    /**
     * Constructor
     *
     * @param int $userid
     * @param int $instanceid
     */
    public function __construct($userid, $instanceid) {
        global $DB;
        $this->userid = $userid;
        $this->instanceid = $instanceid;
        $this->db = $DB;
    }

    /**
     * Get recommended next problem based on adaptive learning algorithm
     *
     * Algorithm considers:
     * 1. Mastery level (lower = higher priority)
     * 2. Time since last attempt (spaced repetition)
     * 3. Error rate (more errors = needs review)
     * 4. Difficulty progression (gradual increase)
     *
     * @return array Problem data with recommendation score
     */
    public function get_recommended_problem() {
        // Get user's learning statistics
        $stats = $this->get_user_statistics();

        // Calculate recommendation scores for each rule
        $rule_scores = $this->calculate_rule_scores($stats);

        if (empty($rule_scores)) {
            // No history - start with easiest rule
            return $this->get_problem_for_beginner();
        }

        // Select rule with highest priority
        $selected_rule = $this->select_rule_by_score($rule_scores);

        // Get appropriate difficulty problem for selected rule
        $problem = $this->get_adaptive_problem($selected_rule);

        return $problem;
    }

    /**
     * Get user's learning statistics
     *
     * @return array Statistics including mastery, attempts, time data
     */
    private function get_user_statistics() {
        $sql = "SELECT
                    r.id as rule_id,
                    r.rule_name,
                    r.difficulty_level as rule_difficulty,
                    COALESCE(AVG(p.mastery_level), 0) as avg_mastery,
                    COALESCE(SUM(p.attempts), 0) as total_attempts,
                    COALESCE(SUM(p.correct_count), 0) as total_correct,
                    MAX(p.last_attempt_time) as last_attempt,
                    COUNT(DISTINCT p.problem_id) as problems_attempted
                FROM {rulepatternizer_rules} r
                LEFT JOIN {rulepatternizer_progress} p
                    ON r.id = p.rule_id
                    AND p.userid = :userid
                    AND p.rulepatternizer_id = :instanceid
                GROUP BY r.id, r.rule_name, r.difficulty_level
                ORDER BY r.difficulty_level ASC";

        return $this->db->get_records_sql($sql, array(
            'userid' => $this->userid,
            'instanceid' => $this->instanceid
        ));
    }

    /**
     * Calculate recommendation scores for each rule
     *
     * Score factors:
     * - Mastery level (40%): Lower mastery = higher score
     * - Time decay (30%): Longer since last attempt = higher score (spaced repetition)
     * - Error rate (20%): Higher error rate = higher score (needs practice)
     * - Sequential learning (10%): Encourage prerequisite completion
     *
     * @param array $stats User statistics
     * @return array Rule IDs with scores
     */
    private function calculate_rule_scores($stats) {
        $scores = array();
        $current_time = time();

        foreach ($stats as $stat) {
            $score = 0;

            // 1. Mastery level factor (40 points max)
            // Lower mastery = higher priority
            $mastery_score = (100 - $stat->avg_mastery) * 0.4;
            $score += $mastery_score;

            // 2. Time decay factor (30 points max) - Spaced Repetition
            if ($stat->last_attempt > 0) {
                $hours_since = ($current_time - $stat->last_attempt) / 3600;

                // Optimal review times: 1 hour, 1 day, 1 week, 1 month
                $time_score = $this->calculate_spaced_repetition_score($hours_since, $stat->avg_mastery);
                $score += $time_score * 0.3;
            } else {
                // Never attempted = high priority
                $score += 30;
            }

            // 3. Error rate factor (20 points max)
            if ($stat->total_attempts > 0) {
                $error_rate = 1 - ($stat->total_correct / $stat->total_attempts);
                $score += $error_rate * 20;
            }

            // 4. Sequential learning factor (10 points max)
            // Encourage completing prerequisites (lower difficulty first)
            $sequential_score = $this->calculate_sequential_score($stat, $stats);
            $score += $sequential_score;

            $scores[$stat->rule_id] = array(
                'rule_id' => $stat->rule_id,
                'rule_name' => $stat->rule_name,
                'score' => $score,
                'mastery' => $stat->avg_mastery,
                'difficulty' => $stat->rule_difficulty
            );
        }

        // Sort by score descending
        usort($scores, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        return $scores;
    }

    /**
     * Calculate spaced repetition score
     *
     * Based on research: optimal review intervals depend on mastery level
     * High mastery: longer intervals
     * Low mastery: shorter intervals
     *
     * @param float $hours_since Hours since last attempt
     * @param float $mastery Current mastery level (0-100)
     * @return float Score (0-100)
     */
    private function calculate_spaced_repetition_score($hours_since, $mastery) {
        // Define optimal review intervals based on mastery
        if ($mastery < 30) {
            $optimal_hours = 1; // Review after 1 hour
        } else if ($mastery < 60) {
            $optimal_hours = 24; // Review after 1 day
        } else if ($mastery < 80) {
            $optimal_hours = 168; // Review after 1 week
        } else {
            $optimal_hours = 720; // Review after 1 month
        }

        // Calculate score: peaks at optimal time, decreases before and after
        $ratio = $hours_since / $optimal_hours;

        if ($ratio < 0.5) {
            // Too soon - lower priority
            return $ratio * 40; // 0-20 points
        } else if ($ratio < 2) {
            // Optimal window - high priority
            return 80 + (1 - abs($ratio - 1)) * 20; // 80-100 points
        } else {
            // Overdue - gradually increasing priority
            return min(100, 60 + ($ratio - 2) * 10); // 60-100 points
        }
    }

    /**
     * Calculate sequential learning score
     *
     * Encourages mastering easier concepts before harder ones
     *
     * @param object $current_stat Current rule statistics
     * @param array $all_stats All rules statistics
     * @return float Score (0-10)
     */
    private function calculate_sequential_score($current_stat, $all_stats) {
        // Count prerequisites (easier rules) that are mastered
        $prerequisites_mastered = 0;
        $total_prerequisites = 0;

        foreach ($all_stats as $stat) {
            if ($stat->rule_difficulty < $current_stat->rule_difficulty) {
                $total_prerequisites++;
                if ($stat->avg_mastery >= 70) {
                    $prerequisites_mastered++;
                }
            }
        }

        if ($total_prerequisites == 0) {
            // No prerequisites - full score
            return 10;
        }

        // Calculate completion ratio
        $completion_ratio = $prerequisites_mastered / $total_prerequisites;

        // Return score: higher if prerequisites are completed
        return $completion_ratio * 10;
    }

    /**
     * Select rule by score with some randomization
     *
     * Uses weighted random selection to avoid predictability
     * while still prioritizing high-score rules
     *
     * @param array $rule_scores Sorted rule scores
     * @return int Selected rule ID
     */
    private function select_rule_by_score($rule_scores) {
        if (empty($rule_scores)) {
            return null;
        }

        // Take top 3 candidates
        $candidates = array_slice($rule_scores, 0, min(3, count($rule_scores)));

        // 70% chance: select highest score
        // 20% chance: select second highest
        // 10% chance: select third highest
        $rand = rand(1, 100);

        if ($rand <= 70 || count($candidates) == 1) {
            return $candidates[0];
        } else if ($rand <= 90 && count($candidates) >= 2) {
            return $candidates[1];
        } else if (count($candidates) >= 3) {
            return $candidates[2];
        }

        return $candidates[0];
    }

    /**
     * Get problem for beginner (no history)
     *
     * @return array Problem data
     */
    private function get_problem_for_beginner() {
        // Start with easiest rule (difficulty level 1)
        $sql = "SELECT p.*
                FROM {rulepatternizer_problems} p
                INNER JOIN {rulepatternizer_rules} r ON p.rule_id = r.id
                WHERE p.rulepatternizer_id = :instanceid
                AND r.difficulty_level = 1
                AND p.difficulty_level = 1
                ORDER BY RAND()
                LIMIT 1";

        $problem = $this->db->get_record_sql($sql, array('instanceid' => $this->instanceid));

        if (!$problem) {
            // Fallback: any easy problem
            return $this->get_random_problem_by_difficulty(1);
        }

        return $this->format_problem_response($problem);
    }

    /**
     * Get adaptive problem for selected rule
     *
     * Selects difficulty based on user's performance
     *
     * @param array $rule_data Selected rule data
     * @return array Problem data
     */
    private function get_adaptive_problem($rule_data) {
        $rule_id = $rule_data['rule_id'];
        $mastery = $rule_data['mastery'];

        // Determine appropriate difficulty based on mastery
        if ($mastery < 30) {
            $target_difficulty = 1; // Easy
        } else if ($mastery < 50) {
            $target_difficulty = 2; // Medium-easy
        } else if ($mastery < 70) {
            $target_difficulty = 3; // Medium
        } else if ($mastery < 85) {
            $target_difficulty = 4; // Medium-hard
        } else {
            $target_difficulty = 5; // Hard
        }

        // Get problems at target difficulty, fallback to any difficulty
        $sql = "SELECT *
                FROM {rulepatternizer_problems}
                WHERE rule_id = :ruleid
                AND rulepatternizer_id = :instanceid
                AND difficulty_level = :difficulty
                ORDER BY RAND()
                LIMIT 1";

        $problem = $this->db->get_record_sql($sql, array(
            'ruleid' => $rule_id,
            'instanceid' => $this->instanceid,
            'difficulty' => $target_difficulty
        ));

        if (!$problem) {
            // Fallback: any problem for this rule
            $sql = "SELECT *
                    FROM {rulepatternizer_problems}
                    WHERE rule_id = :ruleid
                    AND rulepatternizer_id = :instanceid
                    ORDER BY RAND()
                    LIMIT 1";

            $problem = $this->db->get_record_sql($sql, array(
                'ruleid' => $rule_id,
                'instanceid' => $this->instanceid
            ));
        }

        return $this->format_problem_response($problem, $rule_data);
    }

    /**
     * Get random problem by difficulty
     *
     * @param int $difficulty Difficulty level
     * @return array Problem data
     */
    private function get_random_problem_by_difficulty($difficulty) {
        $sql = "SELECT *
                FROM {rulepatternizer_problems}
                WHERE rulepatternizer_id = :instanceid
                AND difficulty_level = :difficulty
                ORDER BY RAND()
                LIMIT 1";

        $problem = $this->db->get_record_sql($sql, array(
            'instanceid' => $this->instanceid,
            'difficulty' => $difficulty
        ));

        return $this->format_problem_response($problem);
    }

    /**
     * Format problem response
     *
     * @param object $problem Problem record
     * @param array $recommendation_data Optional recommendation data
     * @return array Formatted response
     */
    private function format_problem_response($problem, $recommendation_data = null) {
        if (!$problem) {
            return array('error' => 'No problem available');
        }

        $response = array(
            'id' => $problem->id,
            'rule_id' => $problem->rule_id,
            'problem_text' => $problem->problem_text,
            'problem_latex' => $problem->problem_latex,
            'hint' => $problem->hint,
            'difficulty' => $problem->difficulty_level
        );

        if ($recommendation_data) {
            $response['recommendation'] = array(
                'rule_name' => $recommendation_data['rule_name'],
                'current_mastery' => round($recommendation_data['mastery'], 1),
                'score' => round($recommendation_data['score'], 1),
                'reason' => $this->generate_recommendation_reason($recommendation_data)
            );
        }

        return $response;
    }

    /**
     * Generate human-readable recommendation reason
     *
     * @param array $data Recommendation data
     * @return string Reason text
     */
    private function generate_recommendation_reason($data) {
        $mastery = $data['mastery'];

        if ($mastery == 0) {
            return "New concept - let's learn the basics!";
        } else if ($mastery < 30) {
            return "Needs more practice to build foundation";
        } else if ($mastery < 60) {
            return "Making progress - continue practicing";
        } else if ($mastery < 80) {
            return "Good progress - time to review and solidify";
        } else {
            return "Advanced practice - maintaining mastery";
        }
    }

    /**
     * Get learning insights for user
     *
     * Provides analytics about learning progress
     *
     * @return array Insights data
     */
    public function get_learning_insights() {
        $stats = $this->get_user_statistics();

        $insights = array(
            'total_rules' => count($stats),
            'rules_started' => 0,
            'rules_mastered' => 0,
            'average_mastery' => 0,
            'strongest_areas' => array(),
            'weakest_areas' => array(),
            'needs_review' => array()
        );

        $mastery_sum = 0;
        $current_time = time();

        foreach ($stats as $stat) {
            if ($stat->total_attempts > 0) {
                $insights['rules_started']++;
                $mastery_sum += $stat->avg_mastery;

                if ($stat->avg_mastery >= 80) {
                    $insights['rules_mastered']++;
                    $insights['strongest_areas'][] = $stat->rule_name;
                } else if ($stat->avg_mastery < 50) {
                    $insights['weakest_areas'][] = $stat->rule_name;
                }

                // Check if needs review (spaced repetition)
                $hours_since = ($current_time - $stat->last_attempt) / 3600;
                if ($this->needs_review($stat->avg_mastery, $hours_since)) {
                    $insights['needs_review'][] = $stat->rule_name;
                }
            }
        }

        if ($insights['rules_started'] > 0) {
            $insights['average_mastery'] = round($mastery_sum / $insights['rules_started'], 1);
        }

        return $insights;
    }

    /**
     * Check if rule needs review based on spaced repetition
     *
     * @param float $mastery Mastery level
     * @param float $hours_since Hours since last attempt
     * @return bool True if needs review
     */
    private function needs_review($mastery, $hours_since) {
        if ($mastery < 30 && $hours_since >= 1) {
            return true; // Review after 1 hour
        } else if ($mastery < 60 && $hours_since >= 24) {
            return true; // Review after 1 day
        } else if ($mastery < 80 && $hours_since >= 168) {
            return true; // Review after 1 week
        } else if ($mastery >= 80 && $hours_since >= 720) {
            return true; // Review after 1 month
        }
        return false;
    }
}
