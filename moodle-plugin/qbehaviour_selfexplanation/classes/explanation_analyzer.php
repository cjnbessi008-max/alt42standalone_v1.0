<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Explanation analyzer class.
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Analyzer for student explanations.
 *
 * Validates explanation quality using multiple criteria:
 * - Length (characters and words)
 * - Blocked phrases
 * - Required keywords
 * - Structure analysis
 *
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qbehaviour_selfexplanation_analyzer {

    /**
     * Validate an explanation against configured rules.
     *
     * @param string $explanation The explanation text
     * @param stdClass $config Configuration object
     * @param question_definition $question The question object
     * @return array Array of error codes (empty if valid)
     */
    public function validate_explanation($explanation, $config, $question) {
        $errors = array();

        // 1. Length validation
        $char_count = mb_strlen($explanation);
        $word_count = $this->count_words($explanation);

        if ($char_count < $config->min_chars) {
            $errors[] = 'too_short';
        }

        if ($word_count < $config->min_words) {
            $errors[] = 'too_short';
        }

        // 2. Blocked phrases check
        if (!empty($config->blocked_phrases)) {
            $blocked = json_decode($config->blocked_phrases, true);
            if (is_array($blocked)) {
                foreach ($blocked as $phrase) {
                    if (mb_stripos($explanation, $phrase) !== false) {
                        $errors[] = 'blocked_phrase';
                        break;
                    }
                }
            }
        }

        // 3. Required keywords check
        $keywords = $this->get_question_keywords($question->id);
        if (!empty($keywords)) {
            $found_count = 0;
            foreach ($keywords as $keyword) {
                if (mb_stripos($explanation, $keyword->keyword) !== false) {
                    $found_count++;
                }
            }

            // Require at least 30% of keywords to be present
            $required_count = max(1, ceil(count($keywords) * 0.3));
            if ($found_count < $required_count) {
                $errors[] = 'missing_keywords';
            }
        }

        // 4. Detect copy-paste from question text
        if ($this->is_copied_from_question($explanation, $question)) {
            $errors[] = 'copied_from_question';
        }

        return $errors;
    }

    /**
     * Calculate a quality score for the explanation (0.00 - 1.00).
     *
     * @param string $explanation The explanation text
     * @param question_definition $question The question object
     * @return float Quality score
     */
    public function calculate_quality_score($explanation, $question) {
        $score = 0.0;

        // 1. Length score (30%) - longer explanations tend to be more detailed
        $char_count = mb_strlen($explanation);
        $length_score = min($char_count / 200, 1.0) * 0.3;

        // 2. Keyword coverage score (40%)
        $keyword_score = $this->calculate_keyword_score($explanation, $question) * 0.4;

        // 3. Structure score (30%) - check for logical connectors, steps, etc.
        $structure_score = $this->calculate_structure_score($explanation) * 0.3;

        return round($length_score + $keyword_score + $structure_score, 2);
    }

    /**
     * Get keywords associated with a question.
     *
     * @param int $questionid Question ID
     * @return array Array of keyword objects
     */
    protected function get_question_keywords($questionid) {
        global $DB;

        return $DB->get_records('qbehaviour_selfexpl_keywords',
            array('questionid' => $questionid));
    }

    /**
     * Calculate keyword coverage score.
     *
     * @param string $explanation The explanation text
     * @param question_definition $question The question object
     * @return float Score between 0 and 1
     */
    protected function calculate_keyword_score($explanation, $question) {
        $keywords = $this->get_question_keywords($question->id);

        if (empty($keywords)) {
            // No keywords defined, use heuristic
            return $this->heuristic_keyword_score($explanation);
        }

        $total_importance = 0;
        $found_importance = 0;

        foreach ($keywords as $keyword) {
            $importance = $keyword->importance ?? 1;
            $total_importance += $importance;

            if (mb_stripos($explanation, $keyword->keyword) !== false) {
                $found_importance += $importance;
            }
        }

        if ($total_importance == 0) {
            return 0.5; // Default score
        }

        return $found_importance / $total_importance;
    }

    /**
     * Heuristic keyword score when no keywords are defined.
     * Looks for common mathematical/educational terms.
     *
     * @param string $explanation The explanation text
     * @return float Score between 0 and 1
     */
    protected function heuristic_keyword_score($explanation) {
        // Korean mathematical terms
        $ko_terms = ['먼저', '다음', '그러므로', '왜냐하면', '계산', '공식', '방법',
                     '단계', '과정', '때문', '결과', '이유', '개념', '원리'];

        // English mathematical terms
        $en_terms = ['first', 'then', 'therefore', 'because', 'calculate', 'formula',
                     'method', 'step', 'process', 'result', 'reason', 'concept', 'principle'];

        $all_terms = array_merge($ko_terms, $en_terms);
        $found_count = 0;

        foreach ($all_terms as $term) {
            if (mb_stripos($explanation, $term) !== false) {
                $found_count++;
            }
        }

        // Score based on how many terms found
        return min($found_count / 5, 1.0); // Expect at least 5 terms for full score
    }

    /**
     * Calculate structure score based on logical connectors and organization.
     *
     * @param string $explanation The explanation text
     * @return float Score between 0 and 1
     */
    protected function calculate_structure_score($explanation) {
        $score = 0.0;

        // Check for logical connectors (Korean and English)
        $connectors = [
            '먼저', '다음', '그리고', '그러므로', '왜냐하면', '결국', '마지막으로',
            'first', 'next', 'then', 'therefore', 'because', 'finally', 'so'
        ];

        $connector_count = 0;
        foreach ($connectors as $connector) {
            if (mb_stripos($explanation, $connector) !== false) {
                $connector_count++;
            }
        }

        // Connector score (up to 0.5)
        $score += min($connector_count / 3, 0.5);

        // Check for multiple sentences
        $sentence_count = preg_match_all('/[.!?。]/u', $explanation);
        if ($sentence_count >= 3) {
            $score += 0.3;
        } else if ($sentence_count >= 2) {
            $score += 0.15;
        }

        // Check for numbered steps (1. 2. 3. or ①②③)
        if (preg_match('/[1-9]\.|\d+\)/', $explanation) ||
            preg_match('/[①②③④⑤⑥⑦⑧⑨⑩]/u', $explanation)) {
            $score += 0.2;
        }

        return min($score, 1.0);
    }

    /**
     * Check if explanation is mostly copied from question text.
     *
     * @param string $explanation The explanation text
     * @param question_definition $question The question object
     * @return bool True if likely copied
     */
    protected function is_copied_from_question($explanation, $question) {
        $question_text = strip_tags($question->questiontext);

        // Remove common words for better comparison
        $explanation_clean = $this->remove_common_words($explanation);
        $question_clean = $this->remove_common_words($question_text);

        // Check similarity
        similar_text($explanation_clean, $question_clean, $percent);

        // If more than 70% similar, likely copied
        return $percent > 70;
    }

    /**
     * Remove common words from text for comparison.
     *
     * @param string $text Input text
     * @return string Cleaned text
     */
    protected function remove_common_words($text) {
        // Korean common particles
        $ko_common = ['은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '로', '으로'];

        // English common words
        $en_common = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at'];

        $all_common = array_merge($ko_common, $en_common);

        foreach ($all_common as $word) {
            $text = str_replace(' ' . $word . ' ', ' ', ' ' . $text . ' ');
        }

        return trim($text);
    }

    /**
     * Count words in text (handles both English and Korean).
     *
     * @param string $text Input text
     * @return int Word count
     */
    protected function count_words($text) {
        // For English: count words separated by spaces
        $en_count = str_word_count($text);

        // For Korean: count characters (approximation)
        // Korean doesn't have spaces between words like English
        $ko_chars = preg_match_all('/[\x{AC00}-\x{D7AF}]/u', $text);

        // Use the larger count (handles mixed language text)
        return max($en_count, ceil($ko_chars / 2)); // Assume ~2 chars per word in Korean
    }
}
