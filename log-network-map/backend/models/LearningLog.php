<?php
/**
 * Learning Log Model
 * Handles student learning activity logs
 */

class LearningLog {
    private $conn;
    private $table_name = "learning_logs";

    public $id;
    public $student_id;
    public $concept_id;
    public $activity_type;
    public $duration_seconds;
    public $score;
    public $is_correct;
    public $interaction_data;
    public $session_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all logs for a student
     */
    public function getByStudent($student_id) {
        $query = "SELECT ll.*, c.name as concept_name, c.color as concept_color
                  FROM " . $this->table_name . " ll
                  JOIN concepts c ON ll.concept_id = c.id
                  WHERE ll.student_id = ?
                  ORDER BY ll.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $student_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get all logs for a concept
     */
    public function getByConcept($concept_id) {
        $query = "SELECT ll.*, s.name as student_name, s.student_id as student_code
                  FROM " . $this->table_name . " ll
                  JOIN students s ON ll.student_id = s.id
                  WHERE ll.concept_id = ?
                  ORDER BY ll.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $concept_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get learning path analytics for network visualization
     */
    public function getLearningPaths($student_id = null) {
        $query = "SELECT lp.*,
                         c1.name as from_concept_name, c1.color as from_color,
                         c2.name as to_concept_name, c2.color as to_color,
                         s.name as student_name
                  FROM learning_paths lp
                  JOIN concepts c1 ON lp.from_concept_id = c1.id
                  JOIN concepts c2 ON lp.to_concept_id = c2.id
                  JOIN students s ON lp.student_id = s.id";

        if ($student_id !== null) {
            $query .= " WHERE lp.student_id = ?";
        }

        $query .= " ORDER BY lp.transition_count DESC";

        $stmt = $this->conn->prepare($query);

        if ($student_id !== null) {
            $stmt->bindParam(1, $student_id);
        }

        $stmt->execute();
        return $stmt;
    }

    /**
     * Create new learning log
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET student_id = :student_id,
                      concept_id = :concept_id,
                      activity_type = :activity_type,
                      duration_seconds = :duration_seconds,
                      score = :score,
                      is_correct = :is_correct,
                      interaction_data = :interaction_data,
                      session_id = :session_id";

        $stmt = $this->conn->prepare($query);

        // Bind values
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":concept_id", $this->concept_id);
        $stmt->bindParam(":activity_type", $this->activity_type);
        $stmt->bindParam(":duration_seconds", $this->duration_seconds);
        $stmt->bindParam(":score", $this->score);
        $stmt->bindParam(":is_correct", $this->is_correct);
        $stmt->bindParam(":interaction_data", $this->interaction_data);
        $stmt->bindParam(":session_id", $this->session_id);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update or create learning path
     */
    public function updateLearningPath($student_id, $from_concept_id, $to_concept_id, $duration, $is_success) {
        // Check if path exists
        $query = "SELECT id, transition_count, avg_duration_seconds, success_rate
                  FROM learning_paths
                  WHERE student_id = ? AND from_concept_id = ? AND to_concept_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $student_id);
        $stmt->bindParam(2, $from_concept_id);
        $stmt->bindParam(3, $to_concept_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Update existing path
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $new_count = $row['transition_count'] + 1;
            $new_avg_duration = (($row['avg_duration_seconds'] * $row['transition_count']) + $duration) / $new_count;
            $new_success_rate = (($row['success_rate'] * $row['transition_count']) + ($is_success ? 100 : 0)) / $new_count;

            $update_query = "UPDATE learning_paths
                            SET transition_count = ?,
                                avg_duration_seconds = ?,
                                success_rate = ?,
                                last_transition_at = CURRENT_TIMESTAMP
                            WHERE id = ?";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->execute([$new_count, $new_avg_duration, $new_success_rate, $row['id']]);
        } else {
            // Insert new path
            $insert_query = "INSERT INTO learning_paths
                            SET student_id = ?,
                                from_concept_id = ?,
                                to_concept_id = ?,
                                transition_count = 1,
                                avg_duration_seconds = ?,
                                success_rate = ?";
            $insert_stmt = $this->conn->prepare($insert_query);
            $success_rate = $is_success ? 100 : 0;
            $insert_stmt->execute([$student_id, $from_concept_id, $to_concept_id, $duration, $success_rate]);
        }
    }

    /**
     * Get network statistics for visualization
     */
    public function getNetworkStats($student_id = null) {
        $query = "SELECT
                    c.id,
                    c.name,
                    c.color,
                    c.difficulty_level,
                    COUNT(DISTINCT ll.id) as total_interactions,
                    COUNT(DISTINCT ll.student_id) as unique_students,
                    AVG(ll.score) as avg_score,
                    SUM(CASE WHEN ll.activity_type = 'mastery' THEN 1 ELSE 0 END) as mastery_count
                  FROM concepts c
                  LEFT JOIN learning_logs ll ON c.id = ll.concept_id";

        if ($student_id !== null) {
            $query .= " WHERE ll.student_id = ?";
        }

        $query .= " GROUP BY c.id ORDER BY total_interactions DESC";

        $stmt = $this->conn->prepare($query);

        if ($student_id !== null) {
            $stmt->bindParam(1, $student_id);
        }

        $stmt->execute();
        return $stmt;
    }
}
