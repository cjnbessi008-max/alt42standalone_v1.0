<?php
/**
 * Contrapositive Generator - Automatically generates logical contrapositives
 *
 * @package    local_contrapositive
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Class for generating contrapositive statements
 */
class contrapositive_generator {

    /**
     * Negation patterns for Korean language
     * @var array
     */
    private $korean_negation_patterns = [
        // Verbs
        '이다' => '이 아니다',
        '있다' => '없다',
        '크다' => '크지 않다',
        '작다' => '작지 않다',
        '같다' => '같지 않다',
        '다르다' => '다르지 않다',

        // Adjectives
        '많다' => '많지 않다',
        '적다' => '적지 않다',
        '높다' => '높지 않다',
        '낮다' => '낮지 않다',

        // Mathematical terms
        '이상' => '미만',
        '이하' => '초과',
        '초과' => '이하',
        '미만' => '이상',
        '포함' => '포함하지 않',
        '속한' => '속하지 않은',
    ];

    /**
     * Negation patterns for English language
     * @var array
     */
    private $english_negation_patterns = [
        // To be
        'is' => 'is not',
        'are' => 'are not',
        'was' => 'was not',
        'were' => 'were not',

        // Comparatives
        'greater than' => 'not greater than',
        'less than' => 'not less than',
        'equal to' => 'not equal to',

        // Mathematical
        '>' => '≤',
        '<' => '≥',
        '≥' => '<',
        '≤' => '>',
        '=' => '≠',
        '≠' => '=',
        '∈' => '∉',
        '∉' => '∈',
        '⊂' => '⊄',
        '⊄' => '⊂',
    ];

    /**
     * Generate contrapositive from antecedent and consequent
     *
     * @param string $antecedent Original "P" part (If P)
     * @param string $consequent Original "Q" part (then Q)
     * @param string $language Language code ('ko' or 'en')
     * @return array Contrapositive components
     */
    public function generate($antecedent, $consequent, $language = 'ko') {
        // Generate negations
        $neg_consequent = $this->negate($consequent, $language);
        $neg_antecedent = $this->negate($antecedent, $language);

        // Build contrapositive statement
        if ($language === 'ko') {
            $statement = "만약 {$neg_consequent}이면, {$neg_antecedent}이다";
        } else {
            $statement = "If {$neg_consequent}, then {$neg_antecedent}";
        }

        return [
            'statement' => $statement,
            'antecedent' => $neg_consequent,  // If NOT Q
            'consequent' => $neg_antecedent,  // then NOT P
        ];
    }

    /**
     * Negate a statement
     *
     * @param string $statement Statement to negate
     * @param string $language Language code
     * @return string Negated statement
     */
    private function negate($statement, $language = 'ko') {
        $patterns = $language === 'ko'
            ? $this->korean_negation_patterns
            : $this->english_negation_patterns;

        // Try pattern matching
        foreach ($patterns as $positive => $negative) {
            if (strpos($statement, $positive) !== false) {
                return str_replace($positive, $negative, $statement);
            }
        }

        // Fallback: simple negation prefix
        if ($language === 'ko') {
            // Check if already negated
            if (strpos($statement, '않') !== false || strpos($statement, '없') !== false) {
                // Remove negation
                $statement = str_replace(['않', '없', '아니'], '', $statement);
                $statement = preg_replace('/\s+/', ' ', $statement);
                return trim($statement);
            } else {
                return $statement . ' 않다';
            }
        } else {
            // English: add "not" or remove existing "not"
            if (preg_match('/\bnot\b/i', $statement)) {
                return preg_replace('/\bnot\s*/i', '', $statement);
            } else {
                // Insert "not" after first verb
                return preg_replace('/\b(is|are|was|were|has|have|can|will|would|should)\b/i',
                    '$1 not', $statement, 1);
            }
        }
    }

    /**
     * Parse implication statement into antecedent and consequent
     *
     * @param string $statement Full implication statement
     * @param string $language Language code
     * @return array|false Array with 'antecedent' and 'consequent', or false
     */
    public function parse_implication($statement, $language = 'ko') {
        if ($language === 'ko') {
            // Korean pattern: "만약 P이면, Q이다" or "P이면 Q이다"
            $patterns = [
                '/만약\s*(.+?)이면,?\s*(.+?)(이다|다)\.?$/u',
                '/(.+?)이면,?\s*(.+?)(이다|다)\.?$/u',
                '/(.+?)\s*→\s*(.+)$/u',  // Arrow notation
            ];
        } else {
            // English pattern: "If P, then Q" or "P implies Q"
            $patterns = [
                '/If\s+(.+?),?\s+then\s+(.+?)\.?$/i',
                '/(.+?)\s+implies\s+(.+?)\.?$/i',
                '/(.+?)\s*→\s*(.+)$/i',  // Arrow notation
            ];
        }

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $statement, $matches)) {
                return [
                    'antecedent' => trim($matches[1]),
                    'consequent' => trim($matches[2]),
                ];
            }
        }

        return false;
    }

    /**
     * Validate that a contrapositive is logically correct
     *
     * @param string $original_antecedent Original P
     * @param string $original_consequent Original Q
     * @param string $contra_antecedent Generated NOT Q
     * @param string $contra_consequent Generated NOT P
     * @param string $language Language code
     * @return bool True if valid
     */
    public function validate_contrapositive(
        $original_antecedent,
        $original_consequent,
        $contra_antecedent,
        $contra_consequent,
        $language = 'ko'
    ) {
        // Check that contra_antecedent is negation of original_consequent
        $expected_neg_q = $this->negate($original_consequent, $language);
        if ($contra_antecedent !== $expected_neg_q) {
            error_log("Contrapositive validation failed: antecedent mismatch");
            error_log("Expected: {$expected_neg_q}, Got: {$contra_antecedent}");
            return false;
        }

        // Check that contra_consequent is negation of original_antecedent
        $expected_neg_p = $this->negate($original_antecedent, $language);
        if ($contra_consequent !== $expected_neg_p) {
            error_log("Contrapositive validation failed: consequent mismatch");
            error_log("Expected: {$expected_neg_p}, Got: {$contra_consequent}");
            return false;
        }

        return true;
    }

    /**
     * Generate example contrapositive problems
     *
     * @param string $language Language code
     * @return array Array of example problems
     */
    public function get_examples($language = 'ko') {
        if ($language === 'ko') {
            return [
                [
                    'original_antecedent' => 'x > 5',
                    'original_consequent' => 'x > 3',
                    'category' => 'math',
                    'difficulty' => 1,
                ],
                [
                    'original_antecedent' => '어떤 도형이 정사각형',
                    'original_consequent' => '그 도형은 4개의 변을 가짐',
                    'category' => 'geometry',
                    'difficulty' => 2,
                ],
                [
                    'original_antecedent' => 'n이 짝수',
                    'original_consequent' => 'n²은 짝수',
                    'category' => 'number_theory',
                    'difficulty' => 2,
                ],
            ];
        } else {
            return [
                [
                    'original_antecedent' => 'x > 5',
                    'original_consequent' => 'x > 3',
                    'category' => 'math',
                    'difficulty' => 1,
                ],
                [
                    'original_antecedent' => 'a shape is a square',
                    'original_consequent' => 'it has 4 sides',
                    'category' => 'geometry',
                    'difficulty' => 2,
                ],
                [
                    'original_antecedent' => 'n is even',
                    'original_consequent' => 'n² is even',
                    'category' => 'number_theory',
                    'difficulty' => 2,
                ],
            ];
        }
    }
}
