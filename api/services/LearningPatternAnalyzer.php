<?php
/**
 * Learning Pattern Analyzer Service
 * Analyzes student behavior to determine thinking patterns
 */

class LearningPatternAnalyzer {
    private $conn;

    // Pattern detection weights
    const VISUAL_WEIGHT_CLICKS = 1.5;
    const ANALYTICAL_WEIGHT_VIEWS = 1.3;
    const EXPERIMENTAL_WEIGHT_MANIPS = 1.2;

    // Minimum thresholds
    const MIN_ATTEMPTS = 5;
    const MIN_CONFIDENCE = 60.0;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Analyze student's learning pattern
     * Returns: ['visual', 'analytical', 'experimental'] scores and dominant pattern
     */
    public function analyzePattern($student_id) {
        // Get behavior metrics
        $metrics = $this->getBehaviorMetrics($student_id);

        if ($metrics['total_attempts'] < self::MIN_ATTEMPTS) {
            return $this->getDefaultPattern($student_id);
        }

        // Calculate pattern scores
        $scores = $this->calculatePatternScores($metrics);

        // Determine dominant pattern
        $dominant = $this->determineDominantPattern($scores);

        // Calculate confidence level
        $confidence = $this->calculateConfidence($scores, $metrics['total_attempts']);

        // Save to database
        $this->savePattern($student_id, $scores, $dominant, $confidence, $metrics);

        return [
            'student_id' => $student_id,
            'visual_score' => $scores['visual'],
            'analytical_score' => $scores['analytical'],
            'experimental_score' => $scores['experimental'],
            'dominant_pattern' => $dominant,
            'confidence_level' => $confidence,
            'total_attempts' => $metrics['total_attempts'],
            'accuracy_rate' => $metrics['accuracy_rate']
        ];
    }

    /**
     * Get behavior metrics from attempts
     */
    private function getBehaviorMetrics($student_id) {
        $query = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as total_correct,
                    AVG(time_spent_seconds) as avg_time,
                    SUM(visual_tool_clicks) as total_visual_clicks,
                    SUM(step_by_step_views) as total_analytical_views,
                    SUM(interactive_manipulations) as total_experimental_manips,
                    SUM(CASE WHEN hint_type_used = 'visual' THEN 1 ELSE 0 END) as visual_hints,
                    SUM(CASE WHEN hint_type_used = 'analytical' THEN 1 ELSE 0 END) as analytical_hints,
                    SUM(CASE WHEN hint_type_used = 'experimental' THEN 1 ELSE 0 END) as experimental_hints
                  FROM student_attempts
                  WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        $result = $stmt->fetch();

        // Calculate accuracy rate
        $accuracy_rate = 0;
        if ($result['total_attempts'] > 0) {
            $accuracy_rate = ($result['total_correct'] / $result['total_attempts']) * 100;
        }

        $result['accuracy_rate'] = round($accuracy_rate, 2);

        return $result;
    }

    /**
     * Calculate pattern scores based on behavior
     */
    private function calculatePatternScores($metrics) {
        // Base scores from tool usage
        $visual_base = ($metrics['total_visual_clicks'] ?? 0) * self::VISUAL_WEIGHT_CLICKS;
        $analytical_base = ($metrics['total_analytical_views'] ?? 0) * self::ANALYTICAL_WEIGHT_VIEWS;
        $experimental_base = ($metrics['total_experimental_manips'] ?? 0) * self::EXPERIMENTAL_WEIGHT_MANIPS;

        // Add hint preferences
        $visual_base += ($metrics['visual_hints'] ?? 0) * 2;
        $analytical_base += ($metrics['analytical_hints'] ?? 0) * 2;
        $experimental_base += ($metrics['experimental_hints'] ?? 0) * 2;

        // Calculate total
        $total = $visual_base + $analytical_base + $experimental_base;

        // Convert to percentages
        if ($total > 0) {
            $visual_pct = ($visual_base / $total) * 100;
            $analytical_pct = ($analytical_base / $total) * 100;
            $experimental_pct = ($experimental_base / $total) * 100;
        } else {
            // Default balanced scores
            $visual_pct = 33.33;
            $analytical_pct = 33.33;
            $experimental_pct = 33.34;
        }

        return [
            'visual' => round($visual_pct, 2),
            'analytical' => round($analytical_pct, 2),
            'experimental' => round($experimental_pct, 2)
        ];
    }

    /**
     * Determine dominant learning pattern
     */
    private function determineDominantPattern($scores) {
        $max_score = max($scores['visual'], $scores['analytical'], $scores['experimental']);

        // Check if scores are too balanced (within 15% of each other)
        $score_range = max($scores) - min($scores);
        if ($score_range < 15) {
            return 'balanced';
        }

        // Find dominant pattern
        if ($scores['visual'] == $max_score) {
            return 'visual';
        } elseif ($scores['analytical'] == $max_score) {
            return 'analytical';
        } elseif ($scores['experimental'] == $max_score) {
            return 'experimental';
        }

        return 'balanced';
    }

    /**
     * Calculate confidence in pattern detection
     */
    private function calculateConfidence($scores, $total_attempts) {
        // Base confidence on number of attempts
        $attempt_confidence = min(($total_attempts / 20) * 100, 100);

        // Pattern clarity (higher when one pattern dominates)
        $max_score = max($scores['visual'], $scores['analytical'], $scores['experimental']);
        $pattern_confidence = $max_score;

        // Average the two
        $confidence = ($attempt_confidence + $pattern_confidence) / 2;

        return round($confidence, 2);
    }

    /**
     * Save pattern to database
     */
    private function savePattern($student_id, $scores, $dominant, $confidence, $metrics) {
        $query = "INSERT INTO learning_patterns
                  (student_id, visual_score, analytical_score, experimental_score,
                   dominant_pattern, confidence_level,
                   total_problems_attempted, total_correct, accuracy_rate, avg_time_per_problem,
                   last_analyzed_at)
                  VALUES
                  (:student_id, :visual_score, :analytical_score, :experimental_score,
                   :dominant_pattern, :confidence_level,
                   :total_problems_attempted, :total_correct, :accuracy_rate, :avg_time_per_problem,
                   NOW())
                  ON DUPLICATE KEY UPDATE
                   visual_score = :visual_score,
                   analytical_score = :analytical_score,
                   experimental_score = :experimental_score,
                   dominant_pattern = :dominant_pattern,
                   confidence_level = :confidence_level,
                   total_problems_attempted = :total_problems_attempted,
                   total_correct = :total_correct,
                   accuracy_rate = :accuracy_rate,
                   avg_time_per_problem = :avg_time_per_problem,
                   last_analyzed_at = NOW()";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':visual_score', $scores['visual']);
        $stmt->bindParam(':analytical_score', $scores['analytical']);
        $stmt->bindParam(':experimental_score', $scores['experimental']);
        $stmt->bindParam(':dominant_pattern', $dominant);
        $stmt->bindParam(':confidence_level', $confidence);
        $stmt->bindParam(':total_problems_attempted', $metrics['total_attempts']);
        $stmt->bindParam(':total_correct', $metrics['total_correct']);
        $stmt->bindParam(':accuracy_rate', $metrics['accuracy_rate']);
        $stmt->bindParam(':avg_time_per_problem', $metrics['avg_time']);

        return $stmt->execute();
    }

    /**
     * Get default pattern for new students
     */
    private function getDefaultPattern($student_id) {
        return [
            'student_id' => $student_id,
            'visual_score' => 33.33,
            'analytical_score' => 33.33,
            'experimental_score' => 33.34,
            'dominant_pattern' => 'balanced',
            'confidence_level' => 0.00,
            'total_attempts' => 0,
            'accuracy_rate' => 0.00
        ];
    }

    /**
     * Get student's current pattern
     */
    public function getPattern($student_id) {
        $query = "SELECT * FROM learning_patterns WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        $pattern = $stmt->fetch();

        if (!$pattern) {
            // Initialize pattern for new student
            return $this->getDefaultPattern($student_id);
        }

        return $pattern;
    }

    /**
     * Get pattern-specific performance
     */
    public function getPatternPerformance($student_id) {
        $query = "SELECT
                    fp.recommended_for_pattern,
                    COUNT(*) as attempts,
                    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
                    AVG(sa.time_spent_seconds) as avg_time,
                    AVG(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100 as success_rate
                  FROM student_attempts sa
                  JOIN fraction_problems fp ON sa.problem_id = fp.id
                  WHERE sa.student_id = :student_id
                    AND fp.recommended_for_pattern != 'all'
                  GROUP BY fp.recommended_for_pattern";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get recommended difficulty level for student
     */
    public function getRecommendedDifficulty($student_id) {
        $pattern = $this->getPattern($student_id);

        // Base difficulty on accuracy and attempts
        $accuracy = $pattern['accuracy_rate'] ?? 0;
        $attempts = $pattern['total_problems_attempted'] ?? 0;

        if ($attempts < 5) {
            return 1; // Start easy
        }

        // Adjust difficulty based on accuracy
        if ($accuracy >= 80) {
            return min(5, 3 + floor($attempts / 10));
        } elseif ($accuracy >= 60) {
            return 2;
        } else {
            return 1;
        }
    }
}
