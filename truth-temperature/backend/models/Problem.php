<?php
/**
 * Problem Model
 * Handles database operations for inequality problems
 */

class Problem {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get all problems with optional filtering
     */
    public function getAll($category = null, $difficulty = null) {
        $sql = "SELECT * FROM problems WHERE 1=1";
        $params = [];

        if ($category !== null) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        if ($difficulty !== null) {
            $sql .= " AND difficulty_level = ?";
            $params[] = $difficulty;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * Get problem by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM problems WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get problem by Moodle question ID
     */
    public function getByMoodleQuestionId($moodle_question_id) {
        $stmt = $this->db->prepare("SELECT * FROM problems WHERE moodle_question_id = ?");
        $stmt->execute([$moodle_question_id]);
        return $stmt->fetch();
    }

    /**
     * Create a new problem
     */
    public function create($data) {
        $sql = "INSERT INTO problems (
            moodle_question_id,
            question_text,
            inequality_expression,
            left_side,
            right_side,
            operator,
            correct_answer,
            difficulty_level,
            category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);

        $success = $stmt->execute([
            $data['moodle_question_id'] ?? 0,
            $data['question_text'],
            $data['inequality_expression'],
            $data['left_side'],
            $data['right_side'],
            $data['operator'],
            $data['correct_answer'],
            $data['difficulty_level'] ?? 'medium',
            $data['category'] ?? null
        ]);

        return $success ? $this->db->lastInsertId() : false;
    }

    /**
     * Update a problem
     */
    public function update($id, $data) {
        $sql = "UPDATE problems SET
            question_text = ?,
            inequality_expression = ?,
            left_side = ?,
            right_side = ?,
            operator = ?,
            correct_answer = ?,
            difficulty_level = ?,
            category = ?
            WHERE id = ?";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            $data['question_text'],
            $data['inequality_expression'],
            $data['left_side'],
            $data['right_side'],
            $data['operator'],
            $data['correct_answer'],
            $data['difficulty_level'],
            $data['category'],
            $id
        ]);
    }

    /**
     * Delete a problem
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM problems WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Get random problem
     */
    public function getRandom($difficulty = null) {
        $sql = "SELECT * FROM problems";
        $params = [];

        if ($difficulty !== null) {
            $sql .= " WHERE difficulty_level = ?";
            $params[] = $difficulty;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetch();
    }
}
