<?php
/**
 * Trail Service
 * Handles creation, storage, and retrieval of vector translation trails
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/constants.php';

class TrailService {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Create a new trail record
     *
     * @param array $trailData Trail data including vectors, points, and metadata
     * @return array Created trail with ID
     */
    public function createTrail($trailData) {
        try {
            $sql = "INSERT INTO trails (
                        problem_id, student_id, session_id,
                        vector_start_x, vector_start_y,
                        vector_end_x, vector_end_y,
                        trail_points, trail_color, trail_width,
                        translation_vector, translation_distance, translation_angle,
                        animation_duration, animation_easing,
                        is_correct, is_submitted
                    ) VALUES (
                        :problem_id, :student_id, :session_id,
                        :vector_start_x, :vector_start_y,
                        :vector_end_x, :vector_end_y,
                        :trail_points, :trail_color, :trail_width,
                        :translation_vector, :translation_distance, :translation_angle,
                        :animation_duration, :animation_easing,
                        :is_correct, :is_submitted
                    )";

            $stmt = $this->conn->prepare($sql);

            // Calculate translation metrics
            $translationVector = $this->calculateTranslationVector(
                $trailData['vector_start_x'],
                $trailData['vector_start_y'],
                $trailData['vector_end_x'],
                $trailData['vector_end_y']
            );

            // Bind parameters
            $stmt->bindParam(':problem_id', $trailData['problem_id']);
            $stmt->bindParam(':student_id', $trailData['student_id']);
            $stmt->bindParam(':session_id', $trailData['session_id']);
            $stmt->bindParam(':vector_start_x', $trailData['vector_start_x']);
            $stmt->bindParam(':vector_start_y', $trailData['vector_start_y']);
            $stmt->bindParam(':vector_end_x', $trailData['vector_end_x']);
            $stmt->bindParam(':vector_end_y', $trailData['vector_end_y']);

            // JSON encode trail points
            $trailPointsJson = json_encode($trailData['trail_points'] ?? []);
            $stmt->bindParam(':trail_points', $trailPointsJson);

            // Trail visualization settings
            $trailColor = $trailData['trail_color'] ?? TRAIL_DEFAULT_COLOR;
            $trailWidth = $trailData['trail_width'] ?? TRAIL_DEFAULT_WIDTH;
            $stmt->bindParam(':trail_color', $trailColor);
            $stmt->bindParam(':trail_width', $trailWidth);

            // Translation metrics
            $translationVectorJson = json_encode($translationVector);
            $stmt->bindParam(':translation_vector', $translationVectorJson);
            $stmt->bindParam(':translation_distance', $translationVector['distance']);
            $stmt->bindParam(':translation_angle', $translationVector['angle']);

            // Animation settings
            $animationDuration = $trailData['animation_duration'] ?? TRAIL_ANIMATION_DURATION;
            $animationEasing = $trailData['animation_easing'] ?? 'ease-in-out';
            $stmt->bindParam(':animation_duration', $animationDuration);
            $stmt->bindParam(':animation_easing', $animationEasing);

            // Submission status
            $isCorrect = $trailData['is_correct'] ?? 0;
            $isSubmitted = $trailData['is_submitted'] ?? 0;
            $stmt->bindParam(':is_correct', $isCorrect);
            $stmt->bindParam(':is_submitted', $isSubmitted);

            $stmt->execute();

            $trailId = $this->conn->lastInsertId();

            return [
                'success' => true,
                'trail_id' => $trailId,
                'translation' => $translationVector
            ];

        } catch (PDOException $e) {
            error_log("Error creating trail: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to create trail'
            ];
        }
    }

    /**
     * Get trail by ID
     *
     * @param int $trailId Trail ID
     * @return array|null Trail data or null if not found
     */
    public function getTrailById($trailId) {
        try {
            $sql = "SELECT * FROM trails WHERE id = :trail_id LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':trail_id', $trailId);
            $stmt->execute();

            $trail = $stmt->fetch();

            if ($trail) {
                // Decode JSON fields
                $trail['trail_points'] = json_decode($trail['trail_points'], true);
                $trail['translation_vector'] = json_decode($trail['translation_vector'], true);
                return $trail;
            }

            return null;

        } catch (PDOException $e) {
            error_log("Error fetching trail: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get all trails for a specific problem and student
     *
     * @param int $problemId Problem ID
     * @param int $studentId Student ID
     * @return array List of trails
     */
    public function getTrailsByProblemAndStudent($problemId, $studentId) {
        try {
            $sql = "SELECT * FROM trails
                    WHERE problem_id = :problem_id
                    AND student_id = :student_id
                    ORDER BY created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':problem_id', $problemId);
            $stmt->bindParam(':student_id', $studentId);
            $stmt->execute();

            $trails = $stmt->fetchAll();

            // Decode JSON fields for each trail
            foreach ($trails as &$trail) {
                $trail['trail_points'] = json_decode($trail['trail_points'], true);
                $trail['translation_vector'] = json_decode($trail['translation_vector'], true);
            }

            return $trails;

        } catch (PDOException $e) {
            error_log("Error fetching trails: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Record a trail interaction event
     *
     * @param int $trailId Trail ID
     * @param array $interactionData Interaction details
     * @return bool Success status
     */
    public function recordInteraction($trailId, $interactionData) {
        try {
            $sql = "INSERT INTO trail_interactions (
                        trail_id, interaction_type,
                        position_x, position_y,
                        user_input, timestamp
                    ) VALUES (
                        :trail_id, :interaction_type,
                        :position_x, :position_y,
                        :user_input, NOW(3)
                    )";

            $stmt = $this->conn->prepare($sql);

            $stmt->bindParam(':trail_id', $trailId);
            $stmt->bindParam(':interaction_type', $interactionData['type']);
            $stmt->bindParam(':position_x', $interactionData['x']);
            $stmt->bindParam(':position_y', $interactionData['y']);

            $userInputJson = json_encode($interactionData['data'] ?? []);
            $stmt->bindParam(':user_input', $userInputJson);

            $stmt->execute();

            return true;

        } catch (PDOException $e) {
            error_log("Error recording interaction: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update trail with submission status
     *
     * @param int $trailId Trail ID
     * @param array $submissionData Submission details
     * @return bool Success status
     */
    public function submitTrail($trailId, $submissionData) {
        try {
            $sql = "UPDATE trails SET
                        is_submitted = 1,
                        is_correct = :is_correct,
                        score = :score,
                        feedback = :feedback,
                        completed_at = NOW()
                    WHERE id = :trail_id";

            $stmt = $this->conn->prepare($sql);

            $stmt->bindParam(':trail_id', $trailId);
            $stmt->bindParam(':is_correct', $submissionData['is_correct']);
            $stmt->bindParam(':score', $submissionData['score']);
            $stmt->bindParam(':feedback', $submissionData['feedback']);

            $stmt->execute();

            return true;

        } catch (PDOException $e) {
            error_log("Error submitting trail: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate translation vector and metrics
     *
     * @param float $startX Starting X coordinate
     * @param float $startY Starting Y coordinate
     * @param float $endX Ending X coordinate
     * @param float $endY Ending Y coordinate
     * @return array Translation vector data
     */
    private function calculateTranslationVector($startX, $startY, $endX, $endY) {
        $dx = $endX - $startX;
        $dy = $endY - $startY;

        $distance = sqrt($dx * $dx + $dy * $dy);
        $angle = rad2deg(atan2($dy, $dx));

        return [
            'dx' => round($dx, 2),
            'dy' => round($dy, 2),
            'distance' => round($distance, 2),
            'angle' => round($angle, 2)
        ];
    }

    /**
     * Validate trail against problem target
     *
     * @param int $trailId Trail ID
     * @param int $problemId Problem ID
     * @param float $tolerance Allowed tolerance for correctness
     * @return array Validation result
     */
    public function validateTrail($trailId, $problemId, $tolerance = 5.0) {
        try {
            // Get trail data
            $trail = $this->getTrailById($trailId);
            if (!$trail) {
                return ['is_correct' => false, 'error' => 'Trail not found'];
            }

            // Get problem target vector
            $sql = "SELECT target_vector FROM problems WHERE id = :problem_id LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':problem_id', $problemId);
            $stmt->execute();
            $problem = $stmt->fetch();

            if (!$problem || !$problem['target_vector']) {
                return ['is_correct' => false, 'error' => 'Problem target not found'];
            }

            $targetVector = json_decode($problem['target_vector'], true);

            // Calculate distance between trail end and target
            $distance = sqrt(
                pow($trail['vector_end_x'] - $targetVector['x2'], 2) +
                pow($trail['vector_end_y'] - $targetVector['y2'], 2)
            );

            $isCorrect = $distance <= $tolerance;

            return [
                'is_correct' => $isCorrect,
                'distance_from_target' => round($distance, 2),
                'tolerance' => $tolerance,
                'feedback' => $isCorrect
                    ? 'Excellent! Your translation is correct.'
                    : "Not quite. You are {$distance} units away from the target."
            ];

        } catch (PDOException $e) {
            error_log("Error validating trail: " . $e->getMessage());
            return ['is_correct' => false, 'error' => 'Validation failed'];
        }
    }

    /**
     * Get trail statistics for a student
     *
     * @param int $studentId Student ID
     * @return array Statistics data
     */
    public function getStudentStatistics($studentId) {
        try {
            $sql = "SELECT
                        COUNT(*) as total_trails,
                        SUM(is_correct) as correct_trails,
                        AVG(translation_distance) as avg_distance,
                        AVG(score) as avg_score
                    FROM trails
                    WHERE student_id = :student_id
                    AND is_submitted = 1";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':student_id', $studentId);
            $stmt->execute();

            return $stmt->fetch();

        } catch (PDOException $e) {
            error_log("Error fetching statistics: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete trail by ID
     *
     * @param int $trailId Trail ID
     * @return bool Success status
     */
    public function deleteTrail($trailId) {
        try {
            $sql = "DELETE FROM trails WHERE id = :trail_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':trail_id', $trailId);
            $stmt->execute();

            return true;

        } catch (PDOException $e) {
            error_log("Error deleting trail: " . $e->getMessage());
            return false;
        }
    }
}
