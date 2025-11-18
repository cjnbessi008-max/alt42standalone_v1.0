<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Main Difficulty Predictor Class
 *
 * Predicts question difficulty based on multi-factor analysis.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/feature_extractor.php');

/**
 * Class difficulty_predictor
 *
 * Main engine for predicting question difficulty levels.
 */
class difficulty_predictor {

    /** Algorithm version */
    const ALGORITHM_VERSION = 'v1.0';

    /** Default configuration weights */
    const WEIGHT_COMPLEXITY = 0.40;
    const WEIGHT_COGNITIVE = 0.30;
    const WEIGHT_HISTORICAL = 0.20;
    const WEIGHT_QUESTION_TYPE = 0.10;

    /** Minimum attempts before using actual difficulty */
    const MIN_ATTEMPTS_THRESHOLD = 10;

    /**
     * Predict difficulty for a question
     *
     * @param int $questionid Question ID
     * @param bool $forcerecalculate Force recalculation even if cached
     * @return object Prediction result with difficulty, level, and confidence
     */
    public static function predict($questionid, $forcerecalculate = false) {
        global $DB;

        // Check if prediction already exists and is recent.
        if (!$forcerecalculate) {
            $existing = self::get_cached_prediction($questionid);
            if ($existing) {
                return $existing;
            }
        }

        // Load question.
        $question = $DB->get_record('question', array('id' => $questionid), '*', MUST_EXIST);

        // Extract features.
        $features = feature_extractor::extract_features($question);

        // Calculate difficulty components.
        $complexityscore = $features['complexity_score'];
        $cognitiveloadscore = $features['cognitive_load_score'];
        $historicalscore = $features['historical_score'];
        $questiontypescore = $features['question_type_score'];

        // Load configuration weights.
        $config = self::get_config();

        // Calculate weighted difficulty.
        $predicteddifficulty =
            ($complexityscore * $config->weight_complexity) +
            ($cognitiveloadscore * $config->weight_cognitive) +
            ($historicalscore * $config->weight_historical) +
            ($questiontypescore * $config->weight_question_type);

        // Normalize to 0-1 range.
        $predicteddifficulty = max(0.0, min(1.0, $predicteddifficulty));

        // Convert to 1-5 scale.
        $predictedlevel = self::difficulty_to_level($predicteddifficulty);

        // Calculate confidence score.
        $confidence = self::calculate_confidence($features, $question);

        // Save prediction to database.
        $record = new \stdClass();
        $record->questionid = $questionid;
        $record->predicted_difficulty = $predicteddifficulty;
        $record->predicted_level = $predictedlevel;
        $record->confidence_score = $confidence;
        $record->feature_vector = json_encode($features);
        $record->algorithm_version = self::ALGORITHM_VERSION;
        $record->timemodified = time();

        // Check if record exists.
        $existingrecord = $DB->get_record('question_difficulty', array('questionid' => $questionid));

        if ($existingrecord) {
            $record->id = $existingrecord->id;
            $record->timecreated = $existingrecord->timecreated;
            $record->num_attempts = $existingrecord->num_attempts;
            $record->num_correct = $existingrecord->num_correct;
            $record->avg_time_spent = $existingrecord->avg_time_spent;
            $record->actual_difficulty = $existingrecord->actual_difficulty;
            $DB->update_record('question_difficulty', $record);
        } else {
            $record->timecreated = time();
            $record->num_attempts = 0;
            $record->num_correct = 0;
            $record->avg_time_spent = 0;
            $record->id = $DB->insert_record('question_difficulty', $record);
        }

        // Return prediction object.
        $result = new \stdClass();
        $result->questionid = $questionid;
        $result->predicted_difficulty = $predicteddifficulty;
        $result->predicted_level = $predictedlevel;
        $result->confidence_score = $confidence;
        $result->features = $features;

        return $result;
    }

    /**
     * Get cached prediction if available and recent
     *
     * @param int $questionid
     * @return object|null
     */
    private static function get_cached_prediction($questionid) {
        global $DB;

        $config = self::get_config();
        $cachettl = $config->cache_ttl;

        $sql = "SELECT *
                FROM {question_difficulty}
                WHERE questionid = :questionid
                  AND timemodified > :threshold";

        $params = array(
            'questionid' => $questionid,
            'threshold' => time() - $cachettl
        );

        $record = $DB->get_record_sql($sql, $params);

        if ($record) {
            $result = new \stdClass();
            $result->questionid = $record->questionid;
            $result->predicted_difficulty = floatval($record->predicted_difficulty);
            $result->predicted_level = intval($record->predicted_level);
            $result->confidence_score = floatval($record->confidence_score);
            $result->features = json_decode($record->feature_vector, true);
            $result->cached = true;

            return $result;
        }

        return null;
    }

    /**
     * Convert difficulty score (0-1) to level (1-5)
     *
     * @param float $difficulty
     * @return int
     */
    public static function difficulty_to_level($difficulty) {
        // Map 0-1 range to 1-5 levels.
        // 0.0-0.2 => Level 1 (Very Easy)
        // 0.2-0.4 => Level 2 (Easy)
        // 0.4-0.6 => Level 3 (Medium)
        // 0.6-0.8 => Level 4 (Hard)
        // 0.8-1.0 => Level 5 (Very Hard)

        if ($difficulty < 0.2) {
            return 1;
        } else if ($difficulty < 0.4) {
            return 2;
        } else if ($difficulty < 0.6) {
            return 3;
        } else if ($difficulty < 0.8) {
            return 4;
        } else {
            return 5;
        }
    }

    /**
     * Calculate confidence score for prediction
     *
     * @param array $features Extracted features
     * @param object $question Question object
     * @return float Confidence score (0-1)
     */
    private static function calculate_confidence($features, $question) {
        $confidence = 0.5; // Base confidence.

        // Higher confidence if we have historical data.
        if ($features['historical_score'] != 0.5) {
            $confidence += 0.2;
        }

        // Higher confidence if similar questions exist.
        if ($features['similar_questions_difficulty'] != 0.5) {
            $confidence += 0.15;
        }

        // Higher confidence for well-defined question types.
        $welldefinedtypes = array('multichoice', 'truefalse', 'numerical');
        if (in_array($question->qtype, $welldefinedtypes)) {
            $confidence += 0.1;
        }

        // Higher confidence if question has clear structure.
        if ($features['num_operations'] > 0) {
            $confidence += 0.05;
        }

        return min(1.0, $confidence);
    }

    /**
     * Update difficulty based on student performance
     *
     * @param int $questionid
     * @return void
     */
    public static function update_from_performance($questionid) {
        global $DB;

        // Calculate actual difficulty from performance data.
        $sql = "SELECT
                    COUNT(*) as num_attempts,
                    SUM(is_correct) as num_correct,
                    AVG(time_spent) as avg_time_spent
                FROM {question_performance}
                WHERE questionid = :questionid";

        $stats = $DB->get_record_sql($sql, array('questionid' => $questionid));

        if (!$stats || $stats->num_attempts < self::MIN_ATTEMPTS_THRESHOLD) {
            return; // Not enough data yet.
        }

        // Calculate actual difficulty.
        // Difficulty = (1 - success_rate) + (normalized_time * 0.3)
        $successrate = $stats->num_correct / $stats->num_attempts;
        $normalizedtime = min(1.0, $stats->avg_time_spent / 600); // Normalize to 10 minutes.

        $actualdifficulty = (1.0 - $successrate) + ($normalizedtime * 0.3);
        $actualdifficulty = max(0.0, min(1.0, $actualdifficulty));

        // Update record.
        $record = $DB->get_record('question_difficulty', array('questionid' => $questionid));

        if ($record) {
            // Use exponential moving average to update prediction.
            $alpha = 0.7; // Weight for actual difficulty.
            $updateddifficulty = ($alpha * $actualdifficulty) + ((1 - $alpha) * $record->predicted_difficulty);

            $record->actual_difficulty = $actualdifficulty;
            $record->predicted_difficulty = $updateddifficulty;
            $record->predicted_level = self::difficulty_to_level($updateddifficulty);
            $record->num_attempts = $stats->num_attempts;
            $record->num_correct = $stats->num_correct;
            $record->avg_time_spent = intval($stats->avg_time_spent);
            $record->timemodified = time();

            $DB->update_record('question_difficulty', $record);
        }
    }

    /**
     * Get recommended question for adaptive learning
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $currentlevel Current difficulty level
     * @return int|null Question ID or null
     */
    public static function get_adaptive_question($userid, $courseid, $currentlevel) {
        global $DB;

        // Get student's recent performance.
        $sql = "SELECT AVG(is_correct) as success_rate
                FROM {question_performance}
                WHERE userid = :userid
                  AND timecreated > :threshold
                LIMIT 10";

        $params = array(
            'userid' => $userid,
            'threshold' => time() - (7 * 24 * 3600) // Last 7 days.
        );

        $performance = $DB->get_record_sql($sql, $params);

        // Adjust level based on performance.
        $targetlevel = $currentlevel;

        if ($performance && $performance->success_rate > 0.8) {
            // Student is doing well, increase difficulty.
            $targetlevel = min(5, $currentlevel + 1);
        } else if ($performance && $performance->success_rate < 0.5) {
            // Student is struggling, decrease difficulty.
            $targetlevel = max(1, $currentlevel - 1);
        }

        // Find question at target level that user hasn't seen.
        $sql = "SELECT q.id
                FROM {question} q
                JOIN {question_difficulty} qd ON q.id = qd.questionid
                LEFT JOIN {question_performance} qp ON q.id = qp.questionid AND qp.userid = :userid
                WHERE qd.predicted_level = :targetlevel
                  AND q.category IN (
                      SELECT id FROM {question_categories}
                      WHERE contextid IN (
                          SELECT id FROM {context}
                          WHERE contextlevel = 50 AND instanceid = :courseid
                      )
                  )
                  AND qp.id IS NULL
                ORDER BY RAND()
                LIMIT 1";

        $params = array(
            'userid' => $userid,
            'targetlevel' => $targetlevel,
            'courseid' => $courseid
        );

        $result = $DB->get_record_sql($sql, $params);

        return $result ? $result->id : null;
    }

    /**
     * Get configuration for difficulty prediction
     *
     * @return object Configuration object
     */
    private static function get_config() {
        global $DB;

        $config = new \stdClass();

        // Load from database or use defaults.
        $dbconfig = $DB->get_records_menu('difficulty_config', null, '', 'config_key, config_value');

        $config->weight_complexity = isset($dbconfig['weight_complexity']) ?
            floatval($dbconfig['weight_complexity']) : self::WEIGHT_COMPLEXITY;

        $config->weight_cognitive = isset($dbconfig['weight_cognitive']) ?
            floatval($dbconfig['weight_cognitive']) : self::WEIGHT_COGNITIVE;

        $config->weight_historical = isset($dbconfig['weight_historical']) ?
            floatval($dbconfig['weight_historical']) : self::WEIGHT_HISTORICAL;

        $config->weight_question_type = isset($dbconfig['weight_question_type']) ?
            floatval($dbconfig['weight_question_type']) : self::WEIGHT_QUESTION_TYPE;

        $config->cache_ttl = isset($dbconfig['cache_ttl']) ?
            intval($dbconfig['cache_ttl']) : 3600; // 1 hour default.

        return $config;
    }

    /**
     * Batch predict difficulty for multiple questions
     *
     * @param array $questionids Array of question IDs
     * @return array Array of prediction results
     */
    public static function batch_predict($questionids) {
        $results = array();

        foreach ($questionids as $questionid) {
            try {
                $results[$questionid] = self::predict($questionid);
            } catch (\Exception $e) {
                // Log error but continue processing.
                debugging('Error predicting difficulty for question ' . $questionid . ': ' . $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Get difficulty distribution for a course
     *
     * @param int $courseid Course ID
     * @return array Distribution array with counts per level
     */
    public static function get_difficulty_distribution($courseid) {
        global $DB;

        $sql = "SELECT qd.predicted_level, COUNT(*) as count
                FROM {question_difficulty} qd
                JOIN {question} q ON qd.questionid = q.id
                JOIN {question_categories} qc ON q.category = qc.id
                JOIN {context} ctx ON qc.contextid = ctx.id
                WHERE ctx.contextlevel = 50
                  AND ctx.instanceid = :courseid
                GROUP BY qd.predicted_level
                ORDER BY qd.predicted_level";

        $results = $DB->get_records_sql($sql, array('courseid' => $courseid));

        $distribution = array(1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0);

        foreach ($results as $result) {
            $distribution[$result->predicted_level] = $result->count;
        }

        return $distribution;
    }
}
