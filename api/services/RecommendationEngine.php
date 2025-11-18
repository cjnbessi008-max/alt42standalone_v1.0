<?php
/**
 * Recommendation Engine Service
 * Generates personalized problem recommendations based on learning patterns
 */

require_once __DIR__ . '/LearningPatternAnalyzer.php';

class RecommendationEngine {
    private $conn;
    private $analyzer;

    const BATCH_SIZE = 10;
    const DIVERSITY_FACTOR = 0.3; // 30% of recommendations should be diverse

    public function __construct($db) {
        $this->conn = $db;
        $this->analyzer = new LearningPatternAnalyzer($db);
    }

    /**
     * Generate personalized recommendations for student
     */
    public function generateRecommendations($student_id, $count = self::BATCH_SIZE) {
        // Get student's learning pattern
        $pattern = $this->analyzer->getPattern($student_id);
        $dominant = $pattern['dominant_pattern'] ?? 'balanced';

        // Get recommended difficulty
        $difficulty = $this->analyzer->getRecommendedDifficulty($student_id);

        // Get already attempted problems to avoid duplicates
        $attempted_ids = $this->getAttemptedProblemIds($student_id);

        // Calculate how many of each type
        $primary_count = ceil($count * (1 - self::DIVERSITY_FACTOR));
        $diverse_count = $count - $primary_count;

        $recommendations = [];

        // Get primary pattern problems
        $primary_problems = $this->getProblemsForPattern(
            $dominant,
            $difficulty,
            $primary_count,
            $attempted_ids
        );

        foreach ($primary_problems as $problem) {
            $recommendations[] = $this->createRecommendation(
                $student_id,
                $problem,
                100, // High score for primary pattern
                "Matches your {$dominant} learning style"
            );
        }

        // Get diverse problems (other patterns)
        if ($diverse_count > 0) {
            $other_patterns = $this->getOtherPatterns($dominant);
            $diverse_problems = $this->getProblemsForPattern(
                $other_patterns[array_rand($other_patterns)],
                $difficulty,
                $diverse_count,
                $attempted_ids
            );

            foreach ($diverse_problems as $problem) {
                $recommendations[] = $this->createRecommendation(
                    $student_id,
                    $problem,
                    70, // Lower score for diverse problems
                    "Try a different approach to build flexibility"
                );
            }
        }

        // Save recommendations to database
        $this->saveRecommendations($recommendations);

        return $recommendations;
    }

    /**
     * Get problems for specific pattern and difficulty
     */
    private function getProblemsForPattern($pattern, $difficulty, $count, $exclude_ids = []) {
        $exclude_clause = '';
        if (!empty($exclude_ids)) {
            $exclude_clause = "AND id NOT IN (" . implode(',', array_map('intval', $exclude_ids)) . ")";
        }

        // Adjust difficulty range (±1 for variety)
        $min_diff = max(1, $difficulty - 1);
        $max_diff = min(5, $difficulty + 1);

        $query = "SELECT * FROM fraction_problems
                  WHERE (recommended_for_pattern = :pattern OR recommended_for_pattern = 'all')
                  AND difficulty_level BETWEEN :min_diff AND :max_diff
                  {$exclude_clause}
                  ORDER BY RAND()
                  LIMIT :count";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pattern', $pattern);
        $stmt->bindParam(':min_diff', $min_diff, PDO::PARAM_INT);
        $stmt->bindParam(':max_diff', $max_diff, PDO::PARAM_INT);
        $stmt->bindParam(':count', $count, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get other patterns (for diversity)
     */
    private function getOtherPatterns($current_pattern) {
        $all_patterns = ['visual', 'analytical', 'experimental'];
        return array_diff($all_patterns, [$current_pattern]);
    }

    /**
     * Get IDs of problems already attempted
     */
    private function getAttemptedProblemIds($student_id) {
        $query = "SELECT DISTINCT problem_id FROM student_attempts WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return array_column($stmt->fetchAll(), 'problem_id');
    }

    /**
     * Create recommendation object
     */
    private function createRecommendation($student_id, $problem, $score, $reason) {
        return [
            'student_id' => $student_id,
            'problem_id' => $problem['id'],
            'problem' => $problem,
            'recommendation_score' => $score,
            'reason' => $reason,
            'recommended_hint_type' => $this->getRecommendedHintType($student_id)
        ];
    }

    /**
     * Get recommended hint type based on pattern
     */
    private function getRecommendedHintType($student_id) {
        $pattern = $this->analyzer->getPattern($student_id);
        return $pattern['dominant_pattern'] ?? 'analytical';
    }

    /**
     * Save recommendations to database
     */
    private function saveRecommendations($recommendations) {
        $query = "INSERT INTO personalized_recommendations
                  (student_id, problem_id, recommendation_score, reason, recommended_hint_type)
                  VALUES
                  (:student_id, :problem_id, :recommendation_score, :reason, :recommended_hint_type)";

        $stmt = $this->conn->prepare($query);

        foreach ($recommendations as $rec) {
            $stmt->bindParam(':student_id', $rec['student_id']);
            $stmt->bindParam(':problem_id', $rec['problem_id']);
            $stmt->bindParam(':recommendation_score', $rec['recommendation_score']);
            $stmt->bindParam(':reason', $rec['reason']);
            $stmt->bindParam(':recommended_hint_type', $rec['recommended_hint_type']);
            $stmt->execute();
        }

        return true;
    }

    /**
     * Get next recommended problem for student
     */
    public function getNextProblem($student_id) {
        // Check for unpresented recommendations
        $query = "SELECT pr.*, fp.*
                  FROM personalized_recommendations pr
                  JOIN fraction_problems fp ON pr.problem_id = fp.id
                  WHERE pr.student_id = :student_id
                    AND pr.is_presented = FALSE
                    AND pr.is_completed = FALSE
                  ORDER BY pr.recommendation_score DESC, pr.created_at ASC
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        $recommendation = $stmt->fetch();

        if (!$recommendation) {
            // Generate new recommendations if none exist
            $new_recs = $this->generateRecommendations($student_id, 5);
            if (!empty($new_recs)) {
                return $new_recs[0];
            }
            return null;
        }

        // Mark as presented
        $this->markAsPresented($recommendation['id']);

        return $recommendation;
    }

    /**
     * Mark recommendation as presented
     */
    private function markAsPresented($recommendation_id) {
        $query = "UPDATE personalized_recommendations
                  SET is_presented = TRUE, presented_at = NOW()
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $recommendation_id);
        return $stmt->execute();
    }

    /**
     * Mark recommendation as completed
     */
    public function markAsCompleted($student_id, $problem_id) {
        $query = "UPDATE personalized_recommendations
                  SET is_completed = TRUE, completed_at = NOW()
                  WHERE student_id = :student_id AND problem_id = :problem_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':problem_id', $problem_id);
        return $stmt->execute();
    }

    /**
     * Get recommendation statistics for student
     */
    public function getRecommendationStats($student_id) {
        $query = "SELECT
                    COUNT(*) as total_recommended,
                    SUM(CASE WHEN is_presented THEN 1 ELSE 0 END) as presented,
                    SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed,
                    AVG(recommendation_score) as avg_score
                  FROM personalized_recommendations
                  WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Adaptive difficulty adjustment
     */
    public function adjustDifficulty($student_id, $recent_attempts = 5) {
        $query = "SELECT
                    AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 as recent_accuracy,
                    AVG(time_spent_seconds) as avg_time
                  FROM (
                    SELECT * FROM student_attempts
                    WHERE student_id = :student_id
                    ORDER BY attempted_at DESC
                    LIMIT :recent_attempts
                  ) recent";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':recent_attempts', $recent_attempts, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch();
        $accuracy = $result['recent_accuracy'] ?? 0;

        // Determine if difficulty should change
        if ($accuracy >= 85) {
            return 'increase'; // Student is doing very well
        } elseif ($accuracy < 50) {
            return 'decrease'; // Student is struggling
        }

        return 'maintain'; // Current difficulty is appropriate
    }
}
