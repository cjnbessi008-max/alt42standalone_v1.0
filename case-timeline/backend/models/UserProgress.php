<?php
/**
 * UserProgress Model
 * Manages user progress through cases
 */

class UserProgressModel {
    private $conn;
    private $table_name = "ct_user_progress";
    private $responses_table = "ct_user_responses";

    public $id;
    public $case_id;
    public $moodle_user_id;
    public $current_event_id;
    public $completed_events;
    public $total_score;
    public $max_score;
    public $start_time;
    public $completion_time;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get or create user progress for a case
     */
    public function getOrCreateProgress($user_id, $case_id) {
        // Try to get existing progress
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE moodle_user_id = :user_id AND case_id = :case_id
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":case_id", $case_id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            // Progress exists, return it
            $this->id = $row['id'];
            $this->case_id = $row['case_id'];
            $this->moodle_user_id = $row['moodle_user_id'];
            $this->current_event_id = $row['current_event_id'];
            $this->completed_events = $row['completed_events'];
            $this->total_score = $row['total_score'];
            $this->max_score = $row['max_score'];
            $this->start_time = $row['start_time'];
            $this->completion_time = $row['completion_time'];
            $this->status = $row['status'];

            return $this->id;
        } else {
            // Create new progress
            return $this->createProgress($user_id, $case_id);
        }
    }

    /**
     * Create new progress record
     */
    private function createProgress($user_id, $case_id) {
        $query = "INSERT INTO " . $this->table_name . "
                  SET moodle_user_id=:user_id,
                      case_id=:case_id,
                      completed_events='[]',
                      total_score=0,
                      max_score=0,
                      status='not_started',
                      start_time=NOW()";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":case_id", $case_id);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update progress when user advances to next event
     */
    public function updateProgress($progress_id, $event_id, $status = 'in_progress') {
        $query = "UPDATE " . $this->table_name . "
                  SET current_event_id=:event_id,
                      status=:status
                  WHERE id=:progress_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":event_id", $event_id);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":progress_id", $progress_id);

        return $stmt->execute();
    }

    /**
     * Mark event as completed
     */
    public function markEventCompleted($progress_id, $event_id) {
        // Get current completed events
        $query = "SELECT completed_events FROM " . $this->table_name . " WHERE id = :progress_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":progress_id", $progress_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $completed = json_decode($row['completed_events'] ?? '[]', true);

        if (!in_array($event_id, $completed)) {
            $completed[] = $event_id;
        }

        // Update with new completed events list
        $query = "UPDATE " . $this->table_name . "
                  SET completed_events=:completed_events
                  WHERE id=:progress_id";

        $stmt = $this->conn->prepare($query);
        $completed_json = json_encode($completed);
        $stmt->bindParam(":completed_events", $completed_json);
        $stmt->bindParam(":progress_id", $progress_id);

        return $stmt->execute();
    }

    /**
     * Update score
     */
    public function updateScore($progress_id, $points_earned) {
        $query = "UPDATE " . $this->table_name . "
                  SET total_score = total_score + :points
                  WHERE id=:progress_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":points", $points_earned);
        $stmt->bindParam(":progress_id", $progress_id);

        return $stmt->execute();
    }

    /**
     * Mark case as completed
     */
    public function markCaseCompleted($progress_id) {
        $query = "UPDATE " . $this->table_name . "
                  SET status='completed',
                      completion_time=NOW()
                  WHERE id=:progress_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":progress_id", $progress_id);

        return $stmt->execute();
    }

    /**
     * Save user response to an event
     */
    public function saveResponse($progress_id, $event_id, $response_data, $is_correct, $points_earned, $time_spent) {
        // Get attempt number
        $query = "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
                  FROM " . $this->responses_table . "
                  WHERE progress_id = :progress_id AND event_id = :event_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":progress_id", $progress_id);
        $stmt->bindParam(":event_id", $event_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $attempt_number = $row['next_attempt'];

        // Insert response
        $query = "INSERT INTO " . $this->responses_table . "
                  SET progress_id=:progress_id,
                      event_id=:event_id,
                      response_data=:response_data,
                      is_correct=:is_correct,
                      points_earned=:points_earned,
                      attempt_number=:attempt_number,
                      time_spent=:time_spent";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":progress_id", $progress_id);
        $stmt->bindParam(":event_id", $event_id);
        $stmt->bindParam(":response_data", $response_data);
        $stmt->bindParam(":is_correct", $is_correct);
        $stmt->bindParam(":points_earned", $points_earned);
        $stmt->bindParam(":attempt_number", $attempt_number);
        $stmt->bindParam(":time_spent", $time_spent);

        return $stmt->execute();
    }

    /**
     * Get user's responses for a specific event
     */
    public function getUserResponses($progress_id, $event_id) {
        $query = "SELECT * FROM " . $this->responses_table . "
                  WHERE progress_id = :progress_id AND event_id = :event_id
                  ORDER BY attempt_number ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":progress_id", $progress_id);
        $stmt->bindParam(":event_id", $event_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
