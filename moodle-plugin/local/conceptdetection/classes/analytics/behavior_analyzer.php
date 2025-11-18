<?php
/**
 * Behavior Analyzer for Concept Detection
 *
 * Analyzes student behavior patterns to detect understanding levels
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_conceptdetection\analytics;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/conceptdetection/classes/api/moodle_connector.php');

use local_conceptdetection\api\moodle_connector;

class behavior_analyzer {

    /** @var array Configuration thresholds */
    private $thresholds;

    /**
     * Constructor
     */
    public function __construct() {
        $this->thresholds = array(
            'time_threshold' => get_config('local_conceptdetection', 'threshold_time') ?: 60,
            'attempts_threshold' => get_config('local_conceptdetection', 'threshold_attempts') ?: 3,
            'score_threshold' => get_config('local_conceptdetection', 'threshold_score') ?: 60
        );
    }

    /**
     * Analyze student's understanding of a concept
     *
     * @param int $userid User ID
     * @param int $conceptid Concept ID
     * @return array Analysis result with status and confidence
     */
    public function analyze_concept_understanding($userid, $conceptid) {
        global $DB;

        // Get concept details
        $concept = $DB->get_record('local_conceptdetection_concepts', array('id' => $conceptid));
        if (!$concept) {
            return null;
        }

        // Get existing tracking data
        $tracking = $DB->get_record('local_conceptdetection_tracking',
            array('userid' => $userid, 'conceptid' => $conceptid));

        if (!$tracking) {
            // Initialize tracking
            $tracking = new \stdClass();
            $tracking->userid = $userid;
            $tracking->conceptid = $conceptid;
            $tracking->attempts = 0;
            $tracking->timespent = 0;
            $tracking->score = 0;
            $tracking->maxscore = 0;
            $tracking->status = 'not_started';
            $tracking->confidence = 0;
            $tracking->timecreated = time();
            $tracking->timemodified = time();
        }

        // Collect activity data
        $activities = moodle_connector::get_student_activity($userid, $concept->courseid);

        // Filter activities related to this concept
        $concept_activities = $this->filter_concept_activities($activities, $concept);

        // Update tracking metrics
        $tracking->attempts = count($concept_activities);
        $tracking->timespent = $this->calculate_total_time($concept_activities);

        // Calculate average and max scores
        $scores = array_column($concept_activities, 'score');
        if (!empty($scores)) {
            $tracking->score = array_sum($scores) / count($scores);
            $tracking->maxscore = max($scores);
        }

        // Analyze behavior patterns
        $patterns = $this->detect_patterns($concept_activities, $concept);

        // Determine understanding status
        $status_result = $this->determine_status($tracking, $patterns);
        $tracking->status = $status_result['status'];
        $tracking->confidence = $status_result['confidence'];
        $tracking->flags = json_encode($status_result['flags']);
        $tracking->timemodified = time();

        // Save or update tracking
        if (isset($tracking->id)) {
            $DB->update_record('local_conceptdetection_tracking', $tracking);
        } else {
            $tracking->id = $DB->insert_record('local_conceptdetection_tracking', $tracking);
        }

        return array(
            'tracking' => $tracking,
            'patterns' => $patterns,
            'recommendation' => $this->generate_recommendation($tracking, $patterns)
        );
    }

    /**
     * Filter activities related to a specific concept
     *
     * @param array $activities All student activities
     * @param object $concept Concept object
     * @return array Filtered activities
     */
    private function filter_concept_activities($activities, $concept) {
        $filtered = array();

        foreach ($activities as $activity) {
            // Match by module type and ID
            if ($concept->moduletype && $concept->moduleid) {
                if ($activity['type'] === $concept->moduletype &&
                    $activity['moduleid'] == $concept->moduleid) {
                    $filtered[] = $activity;
                    continue;
                }
            }

            // Match by keywords in activity name
            if ($concept->keywords) {
                $keywords = json_decode($concept->keywords, true);
                if (is_array($keywords)) {
                    foreach ($keywords as $keyword) {
                        if (stripos($activity['name'], $keyword) !== false) {
                            $filtered[] = $activity;
                            break;
                        }
                    }
                }
            }
        }

        return $filtered;
    }

    /**
     * Calculate total time spent on activities
     *
     * @param array $activities Activities
     * @return int Total time in seconds
     */
    private function calculate_total_time($activities) {
        $total = 0;
        foreach ($activities as $activity) {
            if (isset($activity['duration']) && $activity['duration'] > 0) {
                // Cap individual session at 2 hours (7200 seconds) to avoid anomalies
                $total += min($activity['duration'], 7200);
            }
        }
        return $total;
    }

    /**
     * Detect behavior patterns indicating lack of understanding
     *
     * @param array $activities Concept-related activities
     * @param object $concept Concept object
     * @return array Detected patterns
     */
    private function detect_patterns($activities, $concept) {
        $patterns = array(
            'quick_exits' => 0,
            'repeated_failures' => 0,
            'score_decline' => false,
            'excessive_attempts' => false,
            'minimal_time' => false,
            'help_seeking' => 0
        );

        if (empty($activities)) {
            return $patterns;
        }

        // Detect quick exits (spent very little time)
        foreach ($activities as $activity) {
            if (isset($activity['duration']) &&
                $activity['duration'] < $this->thresholds['time_threshold']) {
                $patterns['quick_exits']++;
            }
        }

        // Detect repeated failures (low scores)
        $failure_count = 0;
        foreach ($activities as $activity) {
            if (isset($activity['score']) &&
                $activity['score'] < $this->thresholds['score_threshold']) {
                $failure_count++;
            }
        }
        $patterns['repeated_failures'] = $failure_count;

        // Detect score decline trend
        if (count($activities) >= 3) {
            $scores = array_column($activities, 'score');
            $first_half = array_slice($scores, 0, ceil(count($scores) / 2));
            $second_half = array_slice($scores, ceil(count($scores) / 2));

            $avg_first = !empty($first_half) ? array_sum($first_half) / count($first_half) : 0;
            $avg_second = !empty($second_half) ? array_sum($second_half) / count($second_half) : 0;

            if ($avg_second < $avg_first - 10) {  // 10% decline
                $patterns['score_decline'] = true;
            }
        }

        // Detect excessive attempts
        if (count($activities) > $this->thresholds['attempts_threshold']) {
            $patterns['excessive_attempts'] = true;
        }

        // Detect minimal time investment
        $total_time = $this->calculate_total_time($activities);
        $expected_time = $concept->difficulty * 300;  // 5 minutes per difficulty level
        if ($total_time < $expected_time * 0.5) {  // Less than 50% of expected time
            $patterns['minimal_time'] = true;
        }

        return $patterns;
    }

    /**
     * Determine understanding status based on metrics and patterns
     *
     * @param object $tracking Tracking data
     * @param array $patterns Detected patterns
     * @return array Status, confidence, and flags
     */
    private function determine_status($tracking, $patterns) {
        $flags = array();
        $confidence = 0;

        // Score-based analysis (40% weight)
        $score_factor = 0;
        if ($tracking->maxscore >= $this->thresholds['score_threshold']) {
            $score_factor = 40;
        } else if ($tracking->maxscore >= $this->thresholds['score_threshold'] * 0.7) {
            $score_factor = 25;
        } else {
            $flags[] = 'low_score';
        }

        // Attempts-based analysis (20% weight)
        $attempts_factor = 0;
        if ($tracking->attempts <= $this->thresholds['attempts_threshold']) {
            $attempts_factor = 20;
        } else if ($tracking->attempts <= $this->thresholds['attempts_threshold'] * 1.5) {
            $attempts_factor = 10;
            $flags[] = 'many_attempts';
        } else {
            $flags[] = 'excessive_attempts';
        }

        // Time-based analysis (20% weight)
        $time_factor = 0;
        if ($tracking->timespent >= $this->thresholds['time_threshold']) {
            $time_factor = 20;
        } else {
            $flags[] = 'insufficient_time';
        }

        // Pattern-based analysis (20% weight)
        $pattern_factor = 20;
        if ($patterns['quick_exits'] > $tracking->attempts * 0.5) {
            $pattern_factor -= 10;
            $flags[] = 'quick_exits';
        }
        if ($patterns['repeated_failures'] > $tracking->attempts * 0.5) {
            $pattern_factor -= 10;
            $flags[] = 'repeated_failures';
        }
        if ($patterns['score_decline']) {
            $pattern_factor -= 5;
            $flags[] = 'score_decline';
        }

        // Calculate confidence
        $confidence = max(0, min(100, $score_factor + $attempts_factor + $time_factor + $pattern_factor));

        // Determine status
        $status = 'not_started';
        if ($tracking->attempts > 0) {
            if ($confidence >= 70) {
                $status = 'understood';
            } else if ($confidence >= 40) {
                $status = 'partially_understood';
            } else {
                $status = 'not_understood';
            }
        }

        return array(
            'status' => $status,
            'confidence' => $confidence,
            'flags' => $flags
        );
    }

    /**
     * Generate recommendation for the student
     *
     * @param object $tracking Tracking data
     * @param array $patterns Detected patterns
     * @return string Recommendation text
     */
    private function generate_recommendation($tracking, $patterns) {
        $recommendations = array();

        if ($tracking->status === 'not_understood') {
            $recommendations[] = get_string('recommendation_not_understood', 'local_conceptdetection');

            if ($patterns['minimal_time']) {
                $recommendations[] = get_string('recommendation_more_time', 'local_conceptdetection');
            }
            if ($patterns['excessive_attempts']) {
                $recommendations[] = get_string('recommendation_seek_help', 'local_conceptdetection');
            }
            if ($patterns['quick_exits']) {
                $recommendations[] = get_string('recommendation_focus', 'local_conceptdetection');
            }
        } else if ($tracking->status === 'partially_understood') {
            $recommendations[] = get_string('recommendation_partially_understood', 'local_conceptdetection');
        } else if ($tracking->status === 'understood') {
            $recommendations[] = get_string('recommendation_understood', 'local_conceptdetection');
        }

        return implode(' ', $recommendations);
    }

    /**
     * Analyze all students in a course
     *
     * @param int $courseid Course ID
     * @return array Analysis results for all students
     */
    public function analyze_course($courseid) {
        global $DB;

        // Get all enrolled students
        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'mod/quiz:attempt');

        // Get all concepts for this course
        $concepts = $DB->get_records('local_conceptdetection_concepts', array('courseid' => $courseid));

        $results = array();

        foreach ($students as $student) {
            $student_results = array();
            foreach ($concepts as $concept) {
                $analysis = $this->analyze_concept_understanding($student->id, $concept->id);
                if ($analysis) {
                    $student_results[] = $analysis;
                }
            }

            $results[$student->id] = array(
                'student' => $student,
                'concepts' => $student_results,
                'summary' => $this->generate_student_summary($student_results)
            );
        }

        return $results;
    }

    /**
     * Generate summary for a student's overall understanding
     *
     * @param array $concept_results Analysis results for all concepts
     * @return array Summary statistics
     */
    private function generate_student_summary($concept_results) {
        $summary = array(
            'total_concepts' => count($concept_results),
            'understood' => 0,
            'partially_understood' => 0,
            'not_understood' => 0,
            'avg_confidence' => 0
        );

        $total_confidence = 0;

        foreach ($concept_results as $result) {
            $tracking = $result['tracking'];
            $summary[$tracking->status]++;
            $total_confidence += $tracking->confidence;
        }

        if ($summary['total_concepts'] > 0) {
            $summary['avg_confidence'] = $total_confidence / $summary['total_concepts'];
        }

        return $summary;
    }
}
