<?php
/**
 * Event Model
 * Manages timeline events for cases
 */

class EventModel {
    private $conn;
    private $table_name = "ct_events";

    public $id;
    public $case_id;
    public $event_order;
    public $event_time;
    public $title;
    public $content;
    public $event_type;
    public $media_type;
    public $media_url;
    public $is_interactive;
    public $requires_response;
    public $correct_response;
    public $feedback_correct;
    public $feedback_incorrect;
    public $points;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all events for a specific case, ordered by event_order
     */
    public function getEventsByCase($case_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE case_id = :case_id
                  ORDER BY event_order ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":case_id", $case_id);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Get a single event by ID
     */
    public function getEventById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->case_id = $row['case_id'];
            $this->event_order = $row['event_order'];
            $this->event_time = $row['event_time'];
            $this->title = $row['title'];
            $this->content = $row['content'];
            $this->event_type = $row['event_type'];
            $this->media_type = $row['media_type'];
            $this->media_url = $row['media_url'];
            $this->is_interactive = $row['is_interactive'];
            $this->requires_response = $row['requires_response'];
            $this->correct_response = $row['correct_response'];
            $this->feedback_correct = $row['feedback_correct'];
            $this->feedback_incorrect = $row['feedback_incorrect'];
            $this->points = $row['points'];

            return true;
        }

        return false;
    }

    /**
     * Create a new event
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET case_id=:case_id,
                      event_order=:event_order,
                      event_time=:event_time,
                      title=:title,
                      content=:content,
                      event_type=:event_type,
                      media_type=:media_type,
                      media_url=:media_url,
                      is_interactive=:is_interactive,
                      requires_response=:requires_response,
                      correct_response=:correct_response,
                      feedback_correct=:feedback_correct,
                      feedback_incorrect=:feedback_incorrect,
                      points=:points";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->content = htmlspecialchars(strip_tags($this->content));
        $this->event_time = htmlspecialchars(strip_tags($this->event_time));

        // Bind values
        $stmt->bindParam(":case_id", $this->case_id);
        $stmt->bindParam(":event_order", $this->event_order);
        $stmt->bindParam(":event_time", $this->event_time);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":event_type", $this->event_type);
        $stmt->bindParam(":media_type", $this->media_type);
        $stmt->bindParam(":media_url", $this->media_url);
        $stmt->bindParam(":is_interactive", $this->is_interactive);
        $stmt->bindParam(":requires_response", $this->requires_response);
        $stmt->bindParam(":correct_response", $this->correct_response);
        $stmt->bindParam(":feedback_correct", $this->feedback_correct);
        $stmt->bindParam(":feedback_incorrect", $this->feedback_incorrect);
        $stmt->bindParam(":points", $this->points);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Get the next event in the timeline
     */
    public function getNextEvent($case_id, $current_order) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE case_id = :case_id
                  AND event_order > :current_order
                  ORDER BY event_order ASC
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":case_id", $case_id);
        $stmt->bindParam(":current_order", $current_order);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get total possible points for a case
     */
    public function getTotalPoints($case_id) {
        $query = "SELECT SUM(points) as total_points
                  FROM " . $this->table_name . "
                  WHERE case_id = :case_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":case_id", $case_id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total_points'] ?? 0;
    }
}
