<?php
/**
 * Question Model
 * Handles question data and Moodle integration
 */

class Question {
    private $conn;
    private $table = 'questions';

    public $id;
    public $moodle_question_id;
    public $title;
    public $description;
    public $question_type;
    public $difficulty_level;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all questions
     */
    public function getAll($filters = []) {
        $query = "SELECT q.*,
                  GROUP_CONCAT(
                      CONCAT(lo.korean_name, ':', lo.operator_type)
                      ORDER BY qo.position_order
                      SEPARATOR ','
                  ) as operators
                  FROM " . $this->table . " q
                  LEFT JOIN question_operators qo ON q.id = qo.question_id
                  LEFT JOIN logical_operators lo ON qo.operator_id = lo.id
                  WHERE 1=1";

        $params = [];

        if (!empty($filters['question_type'])) {
            $query .= " AND q.question_type = :question_type";
            $params[':question_type'] = $filters['question_type'];
        }

        if (!empty($filters['difficulty_level'])) {
            $query .= " AND q.difficulty_level = :difficulty_level";
            $params[':difficulty_level'] = $filters['difficulty_level'];
        }

        $query .= " GROUP BY q.id ORDER BY q.created_at DESC";

        if (!empty($filters['limit'])) {
            $query .= " LIMIT :limit";
        }

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if (!empty($filters['limit'])) {
            $stmt->bindValue(':limit', (int)$filters['limit'], PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Get question by ID
     */
    public function getById($id) {
        $query = "SELECT q.*,
                  JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'operator_id', qo.operator_id,
                          'operator_type', lo.operator_type,
                          'korean_name', lo.korean_name,
                          'color_code', lo.color_code,
                          'animation_type', lo.animation_type,
                          'position', qo.position_order,
                          'operand_left', qo.operand_left,
                          'operand_right', qo.operand_right,
                          'expected_result', qo.expected_result
                      )
                  ) as operators
                  FROM " . $this->table . " q
                  LEFT JOIN question_operators qo ON q.id = qo.question_id
                  LEFT JOIN logical_operators lo ON qo.operator_id = lo.id
                  WHERE q.id = :id
                  GROUP BY q.id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch();
        if ($result && !empty($result['operators'])) {
            $result['operators'] = json_decode($result['operators'], true);
        }

        return $result;
    }

    /**
     * Get question by Moodle question ID
     */
    public function getByMoodleId($moodle_id) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE moodle_question_id = :moodle_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':moodle_id', $moodle_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Create new question
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table . "
                  (moodle_question_id, title, description, question_type, difficulty_level)
                  VALUES
                  (:moodle_question_id, :title, :description, :question_type, :difficulty_level)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':moodle_question_id', $data['moodle_question_id']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':question_type', $data['question_type']);
        $stmt->bindParam(':difficulty_level', $data['difficulty_level']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update question
     */
    public function update($id, $data) {
        $query = "UPDATE " . $this->table . "
                  SET title = :title,
                      description = :description,
                      question_type = :question_type,
                      difficulty_level = :difficulty_level
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':question_type', $data['question_type']);
        $stmt->bindParam(':difficulty_level', $data['difficulty_level']);

        return $stmt->execute();
    }

    /**
     * Delete question
     */
    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    /**
     * Add operator to question
     */
    public function addOperator($question_id, $operator_data) {
        $query = "INSERT INTO question_operators
                  (question_id, operator_id, position_order, operand_left, operand_right, expected_result)
                  VALUES
                  (:question_id, :operator_id, :position_order, :operand_left, :operand_right, :expected_result)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':question_id', $question_id);
        $stmt->bindParam(':operator_id', $operator_data['operator_id']);
        $stmt->bindParam(':position_order', $operator_data['position_order']);
        $stmt->bindParam(':operand_left', $operator_data['operand_left']);
        $stmt->bindParam(':operand_right', $operator_data['operand_right']);
        $stmt->bindParam(':expected_result', $operator_data['expected_result']);

        return $stmt->execute();
    }

    /**
     * Get random question by filters
     */
    public function getRandom($filters = []) {
        $query = "SELECT * FROM " . $this->table . " WHERE 1=1";

        $params = [];

        if (!empty($filters['question_type'])) {
            $query .= " AND question_type = :question_type";
            $params[':question_type'] = $filters['question_type'];
        }

        if (!empty($filters['difficulty_level'])) {
            $query .= " AND difficulty_level = :difficulty_level";
            $params[':difficulty_level'] = $filters['difficulty_level'];
        }

        $query .= " ORDER BY RAND() LIMIT 1";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        $question = $stmt->fetch();

        if ($question) {
            return $this->getById($question['id']);
        }

        return null;
    }
}
