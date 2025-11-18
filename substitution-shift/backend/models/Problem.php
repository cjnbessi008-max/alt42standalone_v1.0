<?php
/**
 * Problem Model
 *
 * Handles substitution integral problems
 */

class Problem {
    private $conn;
    private $table = 'substitution_problems';

    // Properties
    public $id;
    public $moodle_question_id;
    public $moodle_course_id;
    public $title;
    public $description;
    public $original_integral;
    public $substitution_variable;
    public $substitution_expression;
    public $du_expression;
    public $steps;
    public $final_answer;
    public $difficulty_level;
    public $category;
    public $learning_objectives;
    public $hints;
    public $is_active;
    public $created_by;
    public $created_at;
    public $updated_at;

    /**
     * Constructor
     *
     * @param PDO $db Database connection
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all active problems
     *
     * @param array $filters Optional filters (difficulty, category)
     * @param int $limit Number of results
     * @param int $offset Offset for pagination
     * @return array
     */
    public function getAll($filters = [], $limit = 20, $offset = 0) {
        $query = "SELECT * FROM {$this->table} WHERE is_active = 1";

        // Apply filters
        if (!empty($filters['difficulty'])) {
            $query .= " AND difficulty_level = :difficulty";
        }
        if (!empty($filters['category'])) {
            $query .= " AND category = :category";
        }

        $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);

        // Bind filters
        if (!empty($filters['difficulty'])) {
            $stmt->bindParam(':difficulty', $filters['difficulty']);
        }
        if (!empty($filters['category'])) {
            $stmt->bindParam(':category', $filters['category']);
        }

        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();

        $problems = [];
        while ($row = $stmt->fetch()) {
            $row['steps'] = json_decode($row['steps'], true);
            $row['hints'] = json_decode($row['hints'], true);
            $problems[] = $row;
        }

        return $problems;
    }

    /**
     * Get problem by ID
     *
     * @param int $id Problem ID
     * @return array|null
     */
    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id AND is_active = 1 LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $problem = $stmt->fetch();

        if ($problem) {
            $problem['steps'] = json_decode($problem['steps'], true);
            $problem['hints'] = json_decode($problem['hints'], true);
            return $problem;
        }

        return null;
    }

    /**
     * Get problem by Moodle question ID
     *
     * @param int $moodle_question_id Moodle question ID
     * @return array|null
     */
    public function getByMoodleQuestionId($moodle_question_id) {
        $query = "SELECT * FROM {$this->table}
                  WHERE moodle_question_id = :moodle_question_id
                  AND is_active = 1
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':moodle_question_id', $moodle_question_id, PDO::PARAM_INT);
        $stmt->execute();

        $problem = $stmt->fetch();

        if ($problem) {
            $problem['steps'] = json_decode($problem['steps'], true);
            $problem['hints'] = json_decode($problem['hints'], true);
            return $problem;
        }

        return null;
    }

    /**
     * Create new problem
     *
     * @return int|false Last insert ID or false on failure
     */
    public function create() {
        $query = "INSERT INTO {$this->table}
                  (moodle_question_id, moodle_course_id, title, description,
                   original_integral, substitution_variable, substitution_expression,
                   du_expression, steps, final_answer, difficulty_level,
                   category, learning_objectives, hints, created_by)
                  VALUES
                  (:moodle_question_id, :moodle_course_id, :title, :description,
                   :original_integral, :substitution_variable, :substitution_expression,
                   :du_expression, :steps, :final_answer, :difficulty_level,
                   :category, :learning_objectives, :hints, :created_by)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Encode JSON fields
        $steps_json = json_encode($this->steps);
        $hints_json = $this->hints ? json_encode($this->hints) : null;

        // Bind parameters
        $stmt->bindParam(':moodle_question_id', $this->moodle_question_id);
        $stmt->bindParam(':moodle_course_id', $this->moodle_course_id);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':original_integral', $this->original_integral);
        $stmt->bindParam(':substitution_variable', $this->substitution_variable);
        $stmt->bindParam(':substitution_expression', $this->substitution_expression);
        $stmt->bindParam(':du_expression', $this->du_expression);
        $stmt->bindParam(':steps', $steps_json);
        $stmt->bindParam(':final_answer', $this->final_answer);
        $stmt->bindParam(':difficulty_level', $this->difficulty_level);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':learning_objectives', $this->learning_objectives);
        $stmt->bindParam(':hints', $hints_json);
        $stmt->bindParam(':created_by', $this->created_by);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update problem
     *
     * @return bool
     */
    public function update() {
        $query = "UPDATE {$this->table}
                  SET title = :title,
                      description = :description,
                      original_integral = :original_integral,
                      substitution_variable = :substitution_variable,
                      substitution_expression = :substitution_expression,
                      du_expression = :du_expression,
                      steps = :steps,
                      final_answer = :final_answer,
                      difficulty_level = :difficulty_level,
                      category = :category,
                      learning_objectives = :learning_objectives,
                      hints = :hints
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Encode JSON fields
        $steps_json = json_encode($this->steps);
        $hints_json = $this->hints ? json_encode($this->hints) : null;

        // Bind parameters
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':original_integral', $this->original_integral);
        $stmt->bindParam(':substitution_variable', $this->substitution_variable);
        $stmt->bindParam(':substitution_expression', $this->substitution_expression);
        $stmt->bindParam(':du_expression', $this->du_expression);
        $stmt->bindParam(':steps', $steps_json);
        $stmt->bindParam(':final_answer', $this->final_answer);
        $stmt->bindParam(':difficulty_level', $this->difficulty_level);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':learning_objectives', $this->learning_objectives);
        $stmt->bindParam(':hints', $hints_json);

        return $stmt->execute();
    }

    /**
     * Delete problem (soft delete)
     *
     * @param int $id Problem ID
     * @return bool
     */
    public function delete($id) {
        $query = "UPDATE {$this->table} SET is_active = 0 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Get random problem by difficulty
     *
     * @param string $difficulty Difficulty level
     * @return array|null
     */
    public function getRandom($difficulty = null) {
        $query = "SELECT * FROM {$this->table} WHERE is_active = 1";

        if ($difficulty) {
            $query .= " AND difficulty_level = :difficulty";
        }

        $query .= " ORDER BY RAND() LIMIT 1";

        $stmt = $this->conn->prepare($query);

        if ($difficulty) {
            $stmt->bindParam(':difficulty', $difficulty);
        }

        $stmt->execute();

        $problem = $stmt->fetch();

        if ($problem) {
            $problem['steps'] = json_decode($problem['steps'], true);
            $problem['hints'] = json_decode($problem['hints'], true);
            return $problem;
        }

        return null;
    }
}

?>
