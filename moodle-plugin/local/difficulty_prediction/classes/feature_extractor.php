<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Feature Extractor for Difficulty Prediction
 *
 * Extracts various features from Moodle questions to be used in
 * difficulty prediction algorithms.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction;

defined('MOODLE_INTERNAL') || die();

/**
 * Class feature_extractor
 *
 * Extracts measurable features from questions that correlate with difficulty.
 */
class feature_extractor {

    /**
     * Extract all features from a question
     *
     * @param object $question Question object from mdl_question
     * @return array Associative array of feature values
     */
    public static function extract_features($question) {
        $features = array();

        // Feature 1: Complexity features (40% weight).
        $features['complexity_score'] = self::calculate_complexity_score($question);
        $features['text_length'] = self::get_text_length($question);
        $features['num_operations'] = self::count_math_operations($question);
        $features['nesting_depth'] = self::calculate_nesting_depth($question);

        // Feature 2: Cognitive load features (30% weight).
        $features['cognitive_load_score'] = self::calculate_cognitive_load($question);
        $features['readability_score'] = self::calculate_readability($question);
        $features['num_concepts'] = self::count_concepts($question);
        $features['abstraction_level'] = self::get_abstraction_level($question);

        // Feature 3: Historical features (20% weight).
        $features['historical_score'] = self::get_historical_difficulty($question);
        $features['category_difficulty'] = self::get_category_avg_difficulty($question);
        $features['similar_questions_difficulty'] = self::get_similar_questions_difficulty($question);

        // Feature 4: Question type features (10% weight).
        $features['question_type_score'] = self::get_question_type_difficulty($question);
        $features['answer_format'] = self::get_answer_format_complexity($question);

        return $features;
    }

    /**
     * Calculate complexity score (0.0 - 1.0)
     *
     * @param object $question
     * @return float
     */
    private static function calculate_complexity_score($question) {
        $score = 0.0;

        // Count mathematical operations.
        $operations = self::count_math_operations($question);
        $score += min($operations / 10, 0.4); // Max 0.4 for operations.

        // Nesting depth.
        $depth = self::calculate_nesting_depth($question);
        $score += min($depth / 5, 0.3); // Max 0.3 for depth.

        // Number of variables.
        $variables = self::count_variables($question);
        $score += min($variables / 5, 0.3); // Max 0.3 for variables.

        return min($score, 1.0);
    }

    /**
     * Count mathematical operations in question text
     *
     * @param object $question
     * @return int
     */
    private static function count_math_operations($question) {
        $text = $question->questiontext;

        // Common mathematical operation patterns.
        $patterns = array(
            '/[\+\-\×\÷\*\/]/',  // Basic arithmetic.
            '/\^|\*\*/',          // Exponentiation.
            '/sqrt|log|ln|sin|cos|tan/', // Functions.
            '/\d+\s*\/\s*\d+/',   // Fractions.
            '/\([^\)]+\)/',       // Parentheses (grouping).
        );

        $count = 0;
        foreach ($patterns as $pattern) {
            preg_match_all($pattern, $text, $matches);
            $count += count($matches[0]);
        }

        return $count;
    }

    /**
     * Calculate nesting depth of mathematical expressions
     *
     * @param object $question
     * @return int
     */
    private static function calculate_nesting_depth($question) {
        $text = $question->questiontext;
        $maxdepth = 0;
        $currentdepth = 0;

        for ($i = 0; $i < strlen($text); $i++) {
            if ($text[$i] === '(') {
                $currentdepth++;
                $maxdepth = max($maxdepth, $currentdepth);
            } else if ($text[$i] === ')') {
                $currentdepth--;
            }
        }

        return $maxdepth;
    }

    /**
     * Count number of variables in question
     *
     * @param object $question
     * @return int
     */
    private static function count_variables($question) {
        $text = $question->questiontext;

        // Match single letters that are likely variables (x, y, z, a, b, etc.).
        preg_match_all('/\b[a-z]\b/i', $text, $matches);

        // Count unique variables.
        $variables = array_unique($matches[0]);
        return count($variables);
    }

    /**
     * Get text length (normalized)
     *
     * @param object $question
     * @return int
     */
    private static function get_text_length($question) {
        return strlen(strip_tags($question->questiontext));
    }

    /**
     * Calculate cognitive load score (0.0 - 1.0)
     *
     * @param object $question
     * @return float
     */
    private static function calculate_cognitive_load($question) {
        $score = 0.0;

        // Text complexity.
        $readability = self::calculate_readability($question);
        $score += (1.0 - $readability) * 0.4; // Harder to read = higher cognitive load.

        // Number of concepts.
        $concepts = self::count_concepts($question);
        $score += min($concepts / 5, 0.3);

        // Abstraction level.
        $abstraction = self::get_abstraction_level($question);
        $score += $abstraction * 0.3;

        return min($score, 1.0);
    }

    /**
     * Calculate readability score using Flesch Reading Ease (simplified)
     *
     * @param object $question
     * @return float 0.0 (very hard) to 1.0 (very easy)
     */
    private static function calculate_readability($question) {
        $text = strip_tags($question->questiontext);

        if (empty($text)) {
            return 0.5; // Default for empty text.
        }

        // Count sentences.
        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $sentencecount = count($sentences);

        // Count words.
        $words = str_word_count($text);

        // Count syllables (simplified - count vowel groups).
        $syllables = preg_match_all('/[aeiouy]+/i', $text);

        if ($sentencecount == 0 || $words == 0) {
            return 0.5;
        }

        // Flesch Reading Ease formula (simplified).
        $avgwordspersentence = $words / $sentencecount;
        $avgsyllablesperword = $syllables / $words;

        // Normalize to 0-1 scale (typical range is 0-100).
        $flesch = 206.835 - 1.015 * $avgwordspersentence - 84.6 * $avgsyllablesperword;
        $normalized = max(0, min(100, $flesch)) / 100;

        return $normalized;
    }

    /**
     * Count number of mathematical/domain concepts
     *
     * @param object $question
     * @return int
     */
    private static function count_concepts($question) {
        $text = strtolower($question->questiontext);

        // Mathematical concept keywords.
        $concepts = array(
            'fraction', 'decimal', 'percentage', 'ratio', 'proportion',
            'equation', 'inequality', 'variable', 'constant',
            'addition', 'subtraction', 'multiplication', 'division',
            'exponent', 'root', 'logarithm',
            'geometry', 'algebra', 'calculus', 'trigonometry',
            'probability', 'statistics', 'mean', 'median', 'mode'
        );

        $count = 0;
        foreach ($concepts as $concept) {
            if (strpos($text, $concept) !== false) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Get abstraction level (0.0 = concrete, 1.0 = abstract)
     *
     * @param object $question
     * @return float
     */
    private static function get_abstraction_level($question) {
        $text = strtolower($question->questiontext);

        // Concrete indicators (real-world examples, numbers).
        $concrete = preg_match_all('/\d+/', $text);
        $hasrealworld = preg_match('/(apple|car|person|house|money|time|distance)/', $text);

        // Abstract indicators (variables, general concepts).
        $abstract = self::count_variables($question);
        $hasabstract = preg_match('/(let|suppose|assume|given|prove)/', $text);

        // Calculate abstraction score.
        $abstractscore = ($abstract + ($hasabstract ? 2 : 0)) / 5;
        $concretescore = ($concrete + ($hasrealworld ? 2 : 0)) / 5;

        // Return normalized abstraction level.
        $total = $abstractscore + $concretescore;
        if ($total == 0) {
            return 0.5;
        }

        return $abstractscore / $total;
    }

    /**
     * Get historical difficulty from previous student performance
     *
     * @param object $question
     * @return float
     */
    private static function get_historical_difficulty($question) {
        global $DB;

        $sql = "SELECT AVG(is_correct) as success_rate,
                       COUNT(*) as attempt_count
                FROM {question_performance}
                WHERE questionid = :questionid";

        $result = $DB->get_record_sql($sql, array('questionid' => $question->id));

        if ($result && $result->attempt_count >= 10) {
            // Convert success rate to difficulty (inverse relationship).
            return 1.0 - $result->success_rate;
        }

        return 0.5; // Default if no historical data.
    }

    /**
     * Get average difficulty of questions in the same category
     *
     * @param object $question
     * @return float
     */
    private static function get_category_avg_difficulty($question) {
        global $DB;

        $sql = "SELECT AVG(qd.actual_difficulty) as avg_difficulty
                FROM {question_difficulty} qd
                JOIN {question} q ON qd.questionid = q.id
                WHERE q.category = :category
                  AND qd.actual_difficulty IS NOT NULL
                  AND qd.questionid != :questionid";

        $params = array(
            'category' => $question->category,
            'questionid' => $question->id
        );

        $result = $DB->get_record_sql($sql, $params);

        if ($result && $result->avg_difficulty !== null) {
            return floatval($result->avg_difficulty);
        }

        return 0.5; // Default if no category data.
    }

    /**
     * Get difficulty of similar questions (using tags)
     *
     * @param object $question
     * @return float
     */
    private static function get_similar_questions_difficulty($question) {
        global $DB;

        // Get tags for this question.
        $tags = \core_tag_tag::get_item_tags_array('core_question', 'question', $question->id);

        if (empty($tags)) {
            return 0.5; // No tags, return default.
        }

        // Find questions with similar tags.
        $taglist = "'" . implode("','", $tags) . "'";

        $sql = "SELECT AVG(qd.actual_difficulty) as avg_difficulty
                FROM {question_difficulty} qd
                JOIN {tag_instance} ti ON ti.itemid = qd.questionid
                JOIN {tag} t ON t.id = ti.tagid
                WHERE ti.itemtype = 'question'
                  AND ti.component = 'core_question'
                  AND t.name IN ($taglist)
                  AND qd.actual_difficulty IS NOT NULL
                  AND qd.questionid != :questionid
                GROUP BY qd.questionid
                HAVING COUNT(DISTINCT t.name) >= :mintagmatch";

        $params = array(
            'questionid' => $question->id,
            'mintagmatch' => max(1, floor(count($tags) / 2))
        );

        $result = $DB->get_record_sql($sql, $params);

        if ($result && $result->avg_difficulty !== null) {
            return floatval($result->avg_difficulty);
        }

        return 0.5; // Default if no similar questions.
    }

    /**
     * Get difficulty score based on question type
     *
     * @param object $question
     * @return float
     */
    private static function get_question_type_difficulty($question) {
        // Question type difficulty mapping (based on educational research).
        $typedifficulty = array(
            'truefalse' => 0.2,
            'multichoice' => 0.3,
            'shortanswer' => 0.5,
            'numerical' => 0.6,
            'calculated' => 0.7,
            'essay' => 0.8,
            'match' => 0.5,
            'multianswer' => 0.7,
        );

        $qtype = $question->qtype;

        if (isset($typedifficulty[$qtype])) {
            return $typedifficulty[$qtype];
        }

        return 0.5; // Default for unknown types.
    }

    /**
     * Get answer format complexity
     *
     * @param object $question
     * @return float
     */
    private static function get_answer_format_complexity($question) {
        $qtype = $question->qtype;

        // Check if multiple answers are required.
        if ($qtype === 'multianswer' || $qtype === 'match') {
            return 0.8;
        }

        // Check if numerical precision is required.
        if ($qtype === 'numerical' || $qtype === 'calculated') {
            return 0.7;
        }

        // Open-ended requires more effort.
        if ($qtype === 'essay' || $qtype === 'shortanswer') {
            return 0.6;
        }

        // Multiple choice is easier.
        if ($qtype === 'multichoice') {
            return 0.4;
        }

        return 0.5; // Default.
    }

    /**
     * Normalize feature vector to 0-1 range
     *
     * @param array $features
     * @return array
     */
    public static function normalize_features($features) {
        $normalized = array();

        foreach ($features as $key => $value) {
            if (is_numeric($value)) {
                $normalized[$key] = max(0, min(1, $value));
            } else {
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }
}
