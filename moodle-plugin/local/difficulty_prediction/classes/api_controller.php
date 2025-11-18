<?php
// This file is part of Moodle - http://moodle.org/

/**
 * REST API Controller
 *
 * Provides REST API endpoints for difficulty prediction.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/performance_tracker.php');

/**
 * Class api_controller
 *
 * Handles REST API requests for difficulty prediction.
 */
class api_controller {

    /**
     * Predict difficulty for a question
     *
     * @param array $params Request parameters
     * @return array Response data
     */
    public static function predict($params) {
        global $USER;

        // Validate required parameters.
        if (!isset($params['questionid'])) {
            return self::error_response('Missing required parameter: questionid');
        }

        $questionid = intval($params['questionid']);
        $forcerecalculate = isset($params['force_recalculate']) ? (bool)$params['force_recalculate'] : false;

        // Check capability.
        if (!has_capability('local/difficulty_prediction:view', \context_system::instance())) {
            return self::error_response('Insufficient permissions', 403);
        }

        try {
            $prediction = difficulty_predictor::predict($questionid, $forcerecalculate);

            return self::success_response(array(
                'questionid' => $prediction->questionid,
                'predicted_difficulty' => round($prediction->predicted_difficulty, 2),
                'predicted_level' => $prediction->predicted_level,
                'confidence_score' => round($prediction->confidence_score, 2),
                'features' => array(
                    'complexity_score' => round($prediction->features['complexity_score'], 2),
                    'cognitive_load_score' => round($prediction->features['cognitive_load_score'], 2),
                    'historical_score' => round($prediction->features['historical_score'], 2),
                    'question_type_score' => round($prediction->features['question_type_score'], 2)
                )
            ));
        } catch (\Exception $e) {
            return self::error_response('Prediction failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get analytics for a course or quiz
     *
     * @param array $params Request parameters
     * @return array Response data
     */
    public static function analytics($params) {
        global $DB, $USER;

        // Validate required parameters.
        if (!isset($params['courseid'])) {
            return self::error_response('Missing required parameter: courseid');
        }

        $courseid = intval($params['courseid']);

        // Check capability.
        $context = \context_course::instance($courseid);
        if (!has_capability('local/difficulty_prediction:viewanalytics', $context)) {
            return self::error_response('Insufficient permissions', 403);
        }

        try {
            // Get difficulty distribution.
            $distribution = difficulty_predictor::get_difficulty_distribution($courseid);

            // Calculate average difficulty.
            $totalquestions = array_sum($distribution);
            $weightedsum = 0;

            foreach ($distribution as $level => $count) {
                $weightedsum += $level * $count;
            }

            $avgdifficulty = $totalquestions > 0 ? $weightedsum / $totalquestions : 0;

            // Get prediction accuracy.
            $sql = "SELECT
                        COUNT(*) as total,
                        AVG(ABS(predicted_difficulty - COALESCE(actual_difficulty, predicted_difficulty))) as avg_error
                    FROM {question_difficulty} qd
                    JOIN {question} q ON qd.questionid = q.id
                    JOIN {question_categories} qc ON q.category = qc.id
                    JOIN {context} ctx ON qc.contextid = ctx.id
                    WHERE ctx.contextlevel = 50
                      AND ctx.instanceid = :courseid
                      AND qd.actual_difficulty IS NOT NULL";

            $accuracy = $DB->get_record_sql($sql, array('courseid' => $courseid));

            $accuracyrate = 1.0 - ($accuracy && $accuracy->total > 0 ? $accuracy->avg_error : 0);

            return self::success_response(array(
                'total_questions' => $totalquestions,
                'distribution' => $distribution,
                'avg_difficulty' => round($avgdifficulty, 2),
                'accuracy_rate' => round($accuracyrate, 2)
            ));
        } catch (\Exception $e) {
            return self::error_response('Analytics retrieval failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update performance data
     *
     * @param array $params Request parameters
     * @return array Response data
     */
    public static function update_performance($params) {
        global $USER;

        // Validate required parameters.
        if (!isset($params['attemptid'])) {
            return self::error_response('Missing required parameter: attemptid');
        }

        $attemptid = intval($params['attemptid']);

        // Check capability (must be processing own attempt or be a teacher).
        $attempt = $DB->get_record('quiz_attempts', array('id' => $attemptid), '*', MUST_EXIST);

        if ($attempt->userid != $USER->id &&
            !has_capability('local/difficulty_prediction:manage', \context_system::instance())) {
            return self::error_response('Insufficient permissions', 403);
        }

        try {
            $count = performance_tracker::process_quiz_attempt($attemptid);

            return self::success_response(array(
                'attemptid' => $attemptid,
                'performances_recorded' => $count
            ));
        } catch (\Exception $e) {
            return self::error_response('Performance update failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get student analytics
     *
     * @param array $params Request parameters
     * @return array Response data
     */
    public static function student_analytics($params) {
        global $USER;

        // Validate parameters.
        $userid = isset($params['userid']) ? intval($params['userid']) : $USER->id;
        $courseid = isset($params['courseid']) ? intval($params['courseid']) : null;

        // Check capability.
        if ($userid != $USER->id) {
            if ($courseid) {
                $context = \context_course::instance($courseid);
            } else {
                $context = \context_system::instance();
            }

            if (!has_capability('local/difficulty_prediction:viewanalytics', $context)) {
                return self::error_response('Insufficient permissions', 403);
            }
        }

        try {
            $analytics = performance_tracker::get_student_analytics($userid, $courseid);
            $trend = performance_tracker::get_performance_trend($userid);

            return self::success_response(array(
                'userid' => $userid,
                'questions_attempted' => $analytics->questions_attempted,
                'success_rate' => round($analytics->success_rate, 2),
                'mastery_score' => round($analytics->mastery_score, 2),
                'avg_difficulty_attempted' => round($analytics->avg_difficulty_attempted, 2),
                'avg_time' => intval($analytics->avg_time),
                'performance_trend' => $trend
            ));
        } catch (\Exception $e) {
            return self::error_response('Student analytics retrieval failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Batch predict difficulty for multiple questions
     *
     * @param array $params Request parameters
     * @return array Response data
     */
    public static function batch_predict($params) {
        global $USER;

        // Validate parameters.
        if (!isset($params['questionids']) || !is_array($params['questionids'])) {
            return self::error_response('Missing or invalid parameter: questionids (must be array)');
        }

        // Check capability.
        if (!has_capability('local/difficulty_prediction:view', \context_system::instance())) {
            return self::error_response('Insufficient permissions', 403);
        }

        try {
            $questionids = array_map('intval', $params['questionids']);
            $predictions = difficulty_predictor::batch_predict($questionids);

            $results = array();

            foreach ($predictions as $questionid => $prediction) {
                $results[] = array(
                    'questionid' => $questionid,
                    'predicted_difficulty' => round($prediction->predicted_difficulty, 2),
                    'predicted_level' => $prediction->predicted_level,
                    'confidence_score' => round($prediction->confidence_score, 2)
                );
            }

            return self::success_response(array(
                'predictions' => $results,
                'total' => count($results)
            ));
        } catch (\Exception $e) {
            return self::error_response('Batch prediction failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper: Return success response
     *
     * @param mixed $data Response data
     * @return array
     */
    private static function success_response($data) {
        return array(
            'status' => 'success',
            'data' => $data,
            'timestamp' => time()
        );
    }

    /**
     * Helper: Return error response
     *
     * @param string $message Error message
     * @param int $code HTTP status code
     * @return array
     */
    private static function error_response($message, $code = 400) {
        return array(
            'status' => 'error',
            'error' => array(
                'message' => $message,
                'code' => $code
            ),
            'timestamp' => time()
        );
    }
}
