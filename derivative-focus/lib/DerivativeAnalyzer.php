<?php
/**
 * Derivative Rule Analyzer
 * Detects and highlights derivative rules in mathematical expressions
 */

class DerivativeAnalyzer {
    private $db;
    private $coreRules;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
        $this->loadCoreRules();
    }

    /**
     * Load the 3 core derivative rules from database
     */
    private function loadCoreRules() {
        $stmt = $this->db->prepare(
            "SELECT * FROM derivative_rules
             WHERE is_core_rule = TRUE
             ORDER BY display_order ASC
             LIMIT 3"
        );
        $stmt->execute();
        $this->coreRules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Analyze expression and detect derivative rules
     */
    public function analyzeAndHighlight($problemId, $expression) {
        $detectedRules = [];

        // Clean the expression
        $cleanExpression = $this->cleanExpression($expression);

        // Check each core rule
        foreach ($this->coreRules as $rule) {
            $matches = $this->detectRule($cleanExpression, $rule);

            if (!empty($matches)) {
                foreach ($matches as $match) {
                    // Save to database
                    $this->saveDetectedRule($problemId, $rule['id'], $match);

                    $detectedRules[] = [
                        'rule_id' => $rule['id'],
                        'rule_name' => $rule['rule_name'],
                        'rule_type' => $rule['rule_type'],
                        'rule_formula' => $rule['rule_formula'],
                        'matched_expression' => $match['expression'],
                        'highlight_start' => $match['start'],
                        'highlight_end' => $match['end'],
                        'description' => $rule['description']
                    ];
                }
            }
        }

        return $detectedRules;
    }

    /**
     * Detect if a specific rule applies to the expression
     */
    private function detectRule($expression, $rule) {
        $matches = [];
        $pattern = '/' . $rule['pattern_regex'] . '/i';

        if (preg_match_all($pattern, $expression, $regexMatches, PREG_OFFSET_CAPTURE)) {
            foreach ($regexMatches[0] as $match) {
                $matches[] = [
                    'expression' => $match[0],
                    'start' => $match[1],
                    'end' => $match[1] + strlen($match[0])
                ];
            }
        }

        // Additional heuristic checks based on rule type
        switch ($rule['rule_type']) {
            case 'power_rule':
                $matches = array_merge($matches, $this->detectPowerRule($expression));
                break;
            case 'chain_rule':
                $matches = array_merge($matches, $this->detectChainRule($expression));
                break;
            case 'product_rule':
                $matches = array_merge($matches, $this->detectProductRule($expression));
                break;
        }

        return $matches;
    }

    /**
     * Specialized detection for Power Rule
     */
    private function detectPowerRule($expression) {
        $matches = [];

        // Detect patterns like x^2, x^n, x^(-1), etc.
        $patterns = [
            '/x\^[\d\-]+/',
            '/x\^{[\d\-]+}/',
            '/x\^\([^\)]+\)/',
            '/\b[a-z]\^[\d\-]+/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $expression, $regexMatches, PREG_OFFSET_CAPTURE)) {
                foreach ($regexMatches[0] as $match) {
                    $matches[] = [
                        'expression' => $match[0],
                        'start' => $match[1],
                        'end' => $match[1] + strlen($match[0])
                    ];
                }
            }
        }

        return $matches;
    }

    /**
     * Specialized detection for Chain Rule
     */
    private function detectChainRule($expression) {
        $matches = [];

        // Detect composite functions: f(g(x))
        $patterns = [
            '/\([^\)]+\)\^[\d\-]+/',  // (expression)^n
            '/sin\([^\)]+\)/',         // sin(expression)
            '/cos\([^\)]+\)/',         // cos(expression)
            '/tan\([^\)]+\)/',         // tan(expression)
            '/ln\([^\)]+\)/',          // ln(expression)
            '/log\([^\)]+\)/',         // log(expression)
            '/e\^[^\s]+/',             // e^(expression)
            '/sqrt\([^\)]+\)/',        // sqrt(expression)
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $expression, $regexMatches, PREG_OFFSET_CAPTURE)) {
                foreach ($regexMatches[0] as $match) {
                    $matches[] = [
                        'expression' => $match[0],
                        'start' => $match[1],
                        'end' => $match[1] + strlen($match[0])
                    ];
                }
            }
        }

        return $matches;
    }

    /**
     * Specialized detection for Product Rule
     */
    private function detectProductRule($expression) {
        $matches = [];

        // Detect products: f(x) * g(x)
        $patterns = [
            '/\([^\)]+\)\s*\*\s*\([^\)]+\)/',  // (f) * (g)
            '/\([^\)]+\)\s*\([^\)]+\)/',       // (f)(g) - implicit multiplication
            '/[a-z]\s*\*\s*[a-z]/',            // x * y
            '/\d+x\s*\*\s*\([^\)]+\)/',        // coefficient * function
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $expression, $regexMatches, PREG_OFFSET_CAPTURE)) {
                foreach ($regexMatches[0] as $match) {
                    $matches[] = [
                        'expression' => $match[0],
                        'start' => $match[1],
                        'end' => $match[1] + strlen($match[0])
                    ];
                }
            }
        }

        return $matches;
    }

    /**
     * Clean mathematical expression
     */
    private function cleanExpression($expression) {
        // Remove LaTeX commands but keep the content
        $cleaned = preg_replace('/\\\\(frac|dfrac|tfrac){([^}]*)}{([^}]*)}/', '($2)/($3)', $expression);
        $cleaned = preg_replace('/\\\\(sin|cos|tan|ln|log|sqrt)/', '$1', $cleaned);
        $cleaned = preg_replace('/\\\\/', '', $cleaned);

        // Normalize whitespace
        $cleaned = preg_replace('/\s+/', ' ', $cleaned);

        return trim($cleaned);
    }

    /**
     * Save detected rule to database
     */
    private function saveDetectedRule($problemId, $ruleId, $match) {
        $stmt = $this->db->prepare(
            "INSERT INTO problem_rules
             (problem_id, rule_id, matched_expression, highlight_start, highlight_end)
             VALUES (?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $problemId,
            $ruleId,
            $match['expression'],
            $match['start'],
            $match['end']
        ]);
    }

    /**
     * Get all detected rules for a problem
     */
    public function getDetectedRules($problemId) {
        $stmt = $this->db->prepare(
            "SELECT pr.*, dr.rule_name, dr.rule_type, dr.rule_formula, dr.description
             FROM problem_rules pr
             JOIN derivative_rules dr ON pr.rule_id = dr.id
             WHERE pr.problem_id = ?
             ORDER BY pr.highlight_start ASC"
        );

        $stmt->execute([$problemId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
