<?php
/**
 * Case Model
 * Manages case data and operations
 */

class CaseModel {
    private $conn;
    private $table_name = "ct_cases";

    public $id;
    public $moodle_course_id;
    public $moodle_activity_id;
    public $title;
    public $description;
    public $category;
    public $difficulty_level;
    public $total_duration;
    public $status;
    public $created_by;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all cases for a specific Moodle course
     */
    public function getCasesByCourse($course_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE moodle_course_id = :course_id
                  AND status = 'published'
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":course_id", $course_id);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Get a single case by ID
     */
    public function getCaseById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->moodle_course_id = $row['moodle_course_id'];
            $this->moodle_activity_id = $row['moodle_activity_id'];
            $this->title = $row['title'];
            $this->description = $row['description'];
            $this->category = $row['category'];
            $this->difficulty_level = $row['difficulty_level'];
            $this->total_duration = $row['total_duration'];
            $this->status = $row['status'];
            $this->created_by = $row['created_by'];

            return true;
        }

        return false;
    }

    /**
     * Create a new case
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET moodle_course_id=:moodle_course_id,
                      moodle_activity_id=:moodle_activity_id,
                      title=:title,
                      description=:description,
                      category=:category,
                      difficulty_level=:difficulty_level,
                      total_duration=:total_duration,
                      status=:status,
                      created_by=:created_by";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->category = htmlspecialchars(strip_tags($this->category));

        // Bind values
        $stmt->bindParam(":moodle_course_id", $this->moodle_course_id);
        $stmt->bindParam(":moodle_activity_id", $this->moodle_activity_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":difficulty_level", $this->difficulty_level);
        $stmt->bindParam(":total_duration", $this->total_duration);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":created_by", $this->created_by);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update a case
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET title=:title,
                      description=:description,
                      category=:category,
                      difficulty_level=:difficulty_level,
                      total_duration=:total_duration,
                      status=:status
                  WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->category = htmlspecialchars(strip_tags($this->category));

        // Bind values
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":difficulty_level", $this->difficulty_level);
        $stmt->bindParam(":total_duration", $this->total_duration);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }
}
